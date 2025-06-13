import { Frequency } from 'src/db.schema.js';
import { JwtService } from './jwt.service.js';
import { SubscriptionRepository } from 'src/repositories/subscription.repository.js';
import { APP_URL } from 'src/config.js';
import { Exception, ExceptionCode } from 'src/exception.js';
import { WeatherService } from './weather.service.js';
import { EmailService } from './email.service.js';
import { Logger, LoggerService } from './logger.service.js';

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
  private logger: Logger;

  constructor(
    private jwtService: JwtService,
    private subscriptionRepository: SubscriptionRepository,
    private weatherService: WeatherService,
    private emailService: EmailService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createLogger('WeatherSubscriptionService');
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

    await this.emailService.sendSubscribeEmail({
      to: options.email,
      city: options.city,
      confirmationLink,
    });
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

          await this.emailService.sendWeatherUpdateEmail({
            to: email,
            city,
            unsubscribeLink,
            ...weather,
          })
        }
      }

      this.logger.info({ msg: 'Handling weather subscription has been finished', frequency });
    }
  }
};
