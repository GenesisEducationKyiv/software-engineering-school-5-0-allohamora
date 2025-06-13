import { Resend } from 'resend';
import { RESEND_API_KEY, EMAIL_FROM, EMAIL_NAME } from 'src/config.js';
import { Exception, ExceptionCode } from 'src/exception.js';
import { JSX } from 'hono/jsx/jsx-runtime';
import { SubscribeTemplate, SubscribeTemplateText } from 'src/templates/subscribe.template.js';
import { WeatherUpdateTemplate, WeatherUpdateTemplateText } from 'src/templates/weather-update.template.js';
import { Logger, LoggerService } from './logger.service.js';

type SendEmailOptions = {
  to: string[];
  title: string;
  html?: string;
  text?: string;
  react?: JSX.Element;
};

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

export interface EmailService {
  sendEmail: (options: SendEmailOptions) => Promise<void>;
  sendSubscribeEmail: (options: SubscribeEmailOptions) => Promise<void>;
  sendWeatherUpdateEmail: (options: WeatherUpdateEmailOptions) => Promise<void>;
};

export class ResendEmailService implements EmailService {
  private logger: Logger;
  private resend = new Resend(RESEND_API_KEY);

  constructor(loggerService: LoggerService) {
    this.logger = loggerService.createLogger('ResendEmailService');
  }

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
  };

  public async sendSubscribeEmail({
    to,
    ...props
  }: SubscribeEmailOptions) {
    const template = <SubscribeTemplate {...props} />;

    await this.sendEmail({
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

    await this.sendEmail({
      to: [to],
      title: `Weather update for ${props.city}`,
      html: template.toString(),
      text: WeatherUpdateTemplateText(props),
    });

    this.logger.info({ msg: 'Weather update email sent', to, city: props.city });
  }
}
