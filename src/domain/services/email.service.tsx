import { SubscribeTemplate, SubscribeTemplateText } from 'src/domain/templates/subscribe.template.js';
import { WeatherUpdateTemplate, WeatherUpdateTemplateText } from 'src/domain/templates/weather-update.template.js';
import { Logger, LoggerProvider } from '../providers/logger.provider.js';
import { EmailProvider } from '../providers/email.provider.js';

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
  emailProvider: EmailProvider;
  loggerProvider: LoggerProvider;
};

export class EmailService {
  private emailProvider: EmailProvider;

  private logger: Logger;

  constructor({
    emailProvider,
    loggerProvider
  }: Options) {
    this.emailProvider = emailProvider;
    this.logger = loggerProvider.createLogger('SendEmailTemplateService');
  }

  public async sendSubscribeEmail({
    to,
    ...props
  }: SubscribeEmailOptions) {
    const template = <SubscribeTemplate {...props} />;

    await this.emailProvider.sendEmail({
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

    await this.emailProvider.sendEmail({
      to: [to],
      title: `Weather update for ${props.city}`,
      html: template.toString(),
      text: WeatherUpdateTemplateText(props),
    });

    this.logger.info({ msg: 'Weather update email sent', to, city: props.city });
  }
}
