import { Resend } from 'resend';
import { Logger, LoggerService, Exception, CacheService } from '@weather-subscription/shared';
import {
  GetSubscribeTemplateOptions,
  GetWeatherUpdateTemplateOptions,
  Template,
  TemplateService,
} from './template.service.js';

type Dependencies = {
  templateService: TemplateService;
  cacheService: CacheService;
  loggerService: LoggerService;
  config: { RESEND_API_KEY: string; EMAIL_NAME: string; EMAIL_FROM: string; EMAIL_IGNORE_TTL_SECONDS: number };
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
  private cacheService: CacheService;

  private emailName: string;
  private emailFrom: string;
  private emailIgnoreTTLSeconds: number;

  private resend: Resend;

  private logger: Logger;

  constructor({ templateService, cacheService, loggerService, config }: Dependencies) {
    this.templateService = templateService;
    this.cacheService = cacheService;

    this.emailName = config.EMAIL_NAME;
    this.emailFrom = config.EMAIL_FROM;
    this.emailIgnoreTTLSeconds = config.EMAIL_IGNORE_TTL_SECONDS;

    this.resend = new Resend(config.RESEND_API_KEY);

    this.logger = loggerService.createLogger('EmailService');
  }

  private async sendEmailToProvider({ to, template: { title, ...rest } }: SendEmailOptions) {
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

  public async sendEmail(options: SendEmailOptions) {
    const key = `email:${options.to.toSorted().join(',')}:${options.template.title}`;
    const shouldIgnore = await this.cacheService.get<boolean>(key);

    if (shouldIgnore) {
      this.logger.info({
        msg: 'Email was ignored',
        to: options.to,
        title: options.template.title,
      });
      return;
    }

    await this.sendEmailToProvider(options);

    this.cacheService.set(key, true, this.emailIgnoreTTLSeconds);

    this.logger.debug({
      msg: 'Email sent successfully',
      to: options.to,
      title: options.template.title,
    });
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
