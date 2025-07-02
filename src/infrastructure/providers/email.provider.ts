import { Resend } from 'resend';
import { Exception } from 'src/exception.js';
import { JSX } from 'hono/jsx/jsx-runtime';
import { EmailProvider } from 'src/domain/providers/email.provider.js';
import { Logger, LoggerProvider } from 'src/domain/providers/logger.provider.js';

export type SendEmailOptions = {
  to: string[];
  title: string;
  html?: string;
  text?: string;
  react?: JSX.Element;
};

type Options = {
  loggerProvider: LoggerProvider;
  config: { RESEND_API_KEY: string; EMAIL_NAME: string; EMAIL_FROM: string };
};

export class ResendEmailProvider implements EmailProvider {
  private emailName: string;
  private emailFrom: string;

  private resend: Resend;

  private logger: Logger;

  constructor({ loggerProvider, config }: Options) {
    this.emailName = config.EMAIL_NAME;
    this.emailFrom = config.EMAIL_FROM;

    this.resend = new Resend(config.RESEND_API_KEY);

    this.logger = loggerProvider.createLogger('EmailProvider');
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
