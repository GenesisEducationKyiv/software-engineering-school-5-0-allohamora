import { Resend } from 'resend';
import { Logger, LoggerService, Exception } from '@weather-subscription/shared';
import {
  GetSubscribeTemplateOptions,
  GetWeatherUpdateTemplateOptions,
  Template,
  TemplateService,
} from './template.service.js';

type Options = {
  templateService: TemplateService;
  loggerService: LoggerService;
  config: { RESEND_API_KEY: string; EMAIL_NAME: string; EMAIL_FROM: string };
};

type EmailOptions<T> = {
  to: string[];
} & T;

type SendEmailOptions = EmailOptions<{
  template: Template;
}>;

type SendSubscribeEmailOptions = EmailOptions<GetSubscribeTemplateOptions>;
type SendWeatherUpdateEmailOptions = EmailOptions<GetWeatherUpdateTemplateOptions>;

export class EmailService {
  private templateService: TemplateService;

  private emailName: string;
  private emailFrom: string;

  private resend: Resend;

  private logger: Logger;

  constructor({ templateService, loggerService, config }: Options) {
    this.templateService = templateService;

    this.emailName = config.EMAIL_NAME;
    this.emailFrom = config.EMAIL_FROM;

    this.resend = new Resend(config.RESEND_API_KEY);

    this.logger = loggerService.createLogger('EmailService');
  }

  public async sendEmail({ to, template: { title, ...rest } }: SendEmailOptions) {
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

  public async sendSubscribeEmail({ to, ...options }: SendSubscribeEmailOptions) {
    await this.sendEmail({
      to,
      template: this.templateService.getSubscribeTemplate(options),
    });
  }

  public async sendWeatherUpdateEmail({ to, ...options }: SendWeatherUpdateEmailOptions) {
    await this.sendEmail({
      to,
      template: this.templateService.getWeatherUpdateTemplate(options),
    });
  }
}
