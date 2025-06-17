import { Resend } from 'resend';
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

export interface SendEmailService {
  sendEmail: (options: SendEmailOptions) => Promise<void>;
}

export class ResendSendEmailService implements SendEmailService {
  private resend: Resend;

  constructor(
    private logger: Logger,
    private emailName: string,
    private emailFrom: string,
    resendApiKey: string,
  ) {
    this.resend = new Resend(resendApiKey);
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
      throw new Exception(ExceptionCode.INTERNAL_SERVER_ERROR, error.message);
    }
  }
}
