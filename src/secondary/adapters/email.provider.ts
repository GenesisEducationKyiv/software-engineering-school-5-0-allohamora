import { Resend } from 'resend';
import { Exception } from 'src/domain/entities/exception.entity.js';
import { EmailProvider, SendEmailOptions } from 'src/domain/ports/secondary/email.provider.js';
import { Logger, LoggerProvider } from 'src/domain/ports/secondary/logger.provider.js';

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

  public async sendEmail({ to, template: { title, ...rest } }: SendEmailOptions): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: `${this.emailName} <${this.emailFrom}>`,
      to,
      subject: title,
      ...rest,
    });

    if (error) {
      this.logger.error({ err: error });
      throw Exception.InternalServerError(error.message);
    }
  }
}
