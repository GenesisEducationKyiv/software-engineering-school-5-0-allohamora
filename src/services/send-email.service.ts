import { Resend } from 'resend';
import { RESEND_API_KEY, EMAIL_FROM, EMAIL_NAME } from 'src/config.js';
import { Exception, ExceptionCode } from 'src/exception.js';
import { JSX } from 'hono/jsx/jsx-runtime';
import { Logger } from './logger.service.js';

type SendEmailOptions = {
  to: string[];
  title: string;
  html?: string;
  text?: string;
  react?: JSX.Element;
};

export type SendEmailService = {
  sendEmail: (options: SendEmailOptions) => Promise<void>;
};

export class ResendSendEmailService implements SendEmailService {
  private resend = new Resend(RESEND_API_KEY);

  constructor(private logger: Logger) {}

  public async sendEmail({ to, title, html, text, react }: SendEmailOptions) {
    const { error } = await this.resend.emails.send({
      from: `${EMAIL_NAME} <${EMAIL_FROM}>`,
      to,
      subject: title,
      html,
      text,
      react,
    });

    if (error) {
      this.logger.error({ err: error });
      throw new Exception(ExceptionCode.INTERNAL_SERVER_ERROR, error.message);
    }
  }
}
