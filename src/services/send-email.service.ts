import { Resend } from 'resend';
import { Exception } from 'src/exception.js';
import { JSX } from 'hono/jsx/jsx-runtime';
import { ConfigService } from './config.service.js';
import { Logger, LoggerProvider } from 'src/providers/logger/logger.provider.js';

export type SendEmailOptions = {
  to: string[];
  title: string;
  html?: string;
  text?: string;
  react?: JSX.Element;
};

export class SendEmailService {
  private emailName: string;
  private emailFrom: string;
  private resend: Resend;

  private logger: Logger;

  constructor(loggerProvider: LoggerProvider, configService: ConfigService) {
    this.emailName = configService.get('EMAIL_NAME');
    this.emailFrom = configService.get('EMAIL_FROM');

    this.resend = new Resend(configService.get('RESEND_API_KEY'));

    this.logger = loggerProvider.createLogger('SendEmailService');
  }

  public async sendEmail({ to, title, html, text, react }: SendEmailOptions) {
    const { error } = await this.resend.emails.send({
      from: `${this.emailName} <${this.emailFrom}>`,
      to,
      subject: title,
      html,
      text,
      react,
    });

    if (error) {
      this.logger.error({ err: error });
      throw Exception.InternalServerError(error.message);
    }
  }
}
