import { Frequency } from 'src/db.schema.js';
import { JwtService } from './jwt.service.js';
import { SubscriptionRepository } from 'src/repositories/subscription.repository.js';
import { APP_URL } from 'src/config.js';
import { Exception, ExceptionCode } from 'src/exception.js';
import { createLogger } from 'src/libs/pino.lib.js';
import { sendEmail } from 'src/libs/email.lib.js';
import { SubscribeTemplate, SubscribeTemplateText } from 'src/templates/subscribe.template.js';
import { WeatherService } from './weather.service.js';
import { WeatherUpdateTemplate, WeatherUpdateTemplateText } from 'src/templates/weather-update.template.js';

export type SubscribeOptions = {
  email: string;
  city: string;
  frequency: Frequency;
};

export interface SubscriptionService {
  subscribe: (options: SubscribeOptions) => Promise<void>;
  confirm: (token: string) => Promise<void>;
  unsubscribe: (subscriptionId: string) => Promise<void>;
  handleWeatherSubscription: (frequency: Frequency) => () => Promise<void>;
};

export class WeatherSubscriptionService implements SubscriptionService {
  private logger = createLogger('WeatherSubscriptionService');

  constructor(
    private jwtService: JwtService,
    private subscriptionRepository: SubscriptionRepository,
    private weatherService: WeatherService
  ) {

  }

  private async checkIsSubscriptionExists(email: string) {
    if (await this.subscriptionRepository.isSubscriptionExists(email)) {
      throw new Exception(ExceptionCode.ALREADY_EXISTS, 'Subscription already exists');
    }
  };

  public async subscribe(options: SubscribeOptions) {
    await this.checkIsSubscriptionExists(options.email);

    await this.weatherService.validateCity(options.city);

    const token = await this.jwtService.sign(options);
    const confirmationLink = `${APP_URL}/api/confirm/${token}`;

    const template = <SubscribeTemplate {...options} confirmationLink={confirmationLink} />;

    await sendEmail({
      to: [options.email],
      title: `Confirm your weather subscription for ${options.city}`,
      html: template.toString(),
      text: SubscribeTemplateText({ ...options, confirmationLink }),
    });

    this.logger.info({ email: options.email, city: options.city }, 'Confirmation email sent');
  }

  public async confirm(token: string) {
    const options = await this.jwtService.verify<SubscribeOptions>(token);

    await this.checkIsSubscriptionExists(options.email);

    await this.subscriptionRepository.createSubscription(options);
  }

  public async unsubscribe(subscriptionId: string) {
    await this.subscriptionRepository.removeSubscriptionById(subscriptionId);
  }

  public handleWeatherSubscription(frequency: Frequency) {
    return async () => {
      this.logger.info({ msg: 'Handling weather subscription has been started', frequency });

      for await (const subscriptions of this.subscriptionRepository.iterateSubscriptions(frequency)) {
        for (const { id, email, city } of subscriptions) {
          const weather = await this.weatherService.getWeather(city);
          const unsubscribeLink = `${APP_URL}/api/unsubscribe/${id}`;

          const props = {
            city,
            unsubscribeLink,
            ...weather,
          };

          const template = <WeatherUpdateTemplate {...props} />;

          await sendEmail({
            to: [email],
            title: `Weather update for ${city}`,
            html: template.toString(),
            text: WeatherUpdateTemplateText(props),
          });
        }
      }

      this.logger.info({ msg: 'Handling weather subscription has been finished', frequency });
    }
  }
};
