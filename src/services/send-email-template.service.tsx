import { SubscribeTemplate, SubscribeTemplateText } from 'src/templates/subscribe.template.js';
import { WeatherUpdateTemplate, WeatherUpdateTemplateText } from 'src/templates/weather-update.template.js';
import { Logger, LoggerService } from './logger.service.js';
import { SendEmailService } from './send-email.service.js';

type SubscribeEmailOptions = {
  to: string;
  city: string;
  confirmationLink: string;
};

type WeatherUpdateEmailOptions = {
  to: string;
  city: string;
  unsubscribeLink: string;
  temperature: number;
  humidity: number;
  description: string;
};

type Options = {
  sendEmailService: SendEmailService;
  loggerService: LoggerService;
};

export class SendEmailTemplateService {
  private sendEmailService: SendEmailService;

  private logger: Logger;

  constructor({
    sendEmailService,
    loggerService
  }: Options) {
    this.sendEmailService = sendEmailService;
    this.logger = loggerService.createLogger('SendEmailTemplateService');
  }

  public async sendSubscribeEmail({
    to,
    ...props
  }: SubscribeEmailOptions) {
    const template = <SubscribeTemplate {...props} />;

    await this.sendEmailService.sendEmail({
      to: [to],
      title: `Confirm your weather subscription for ${props.city}`,
      html: template.toString(),
      text: SubscribeTemplateText(props),
    });

    this.logger.info({ msg: 'Confirmation email sent', to, city: props.city });
  }

  public async sendWeatherUpdateEmail({
    to,
    ...props
  }: WeatherUpdateEmailOptions) {
    const template = <WeatherUpdateTemplate {...props} />;

    await this.sendEmailService.sendEmail({
      to: [to],
      title: `Weather update for ${props.city}`,
      html: template.toString(),
      text: WeatherUpdateTemplateText(props),
    });

    this.logger.info({ msg: 'Weather update email sent', to, city: props.city });
  }
}
