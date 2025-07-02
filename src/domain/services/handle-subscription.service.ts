import Dataloader from 'dataloader';
import { EmailService } from './email.service.js';
import { WeatherService } from './weather.service.js';
import { Logger, LoggerProvider } from '../providers/logger.provider.js';
import { Weather } from '../entities/weather.entity.js';
import { SubscriptionRepository } from '../repositories/subscription.repository.js';
import { Frequency } from '../entities/subscription.entity.js';

type Options = {
  subscriptionRepository: SubscriptionRepository;
  weatherService: WeatherService;
  emailService: EmailService;
  loggerProvider: LoggerProvider;
  config: { APP_URL: string };
};

export class HandleSubscriptionService {
  private subscriptionRepository: SubscriptionRepository;
  private weatherService: WeatherService;
  private emailService: EmailService;

  private appUrl: string;

  private logger: Logger;

  constructor({ subscriptionRepository, weatherService, emailService, loggerProvider, config }: Options) {
    this.subscriptionRepository = subscriptionRepository;
    this.weatherService = weatherService;
    this.emailService = emailService;

    this.appUrl = config.APP_URL;

    this.logger = loggerProvider.createLogger('HandleSubscriptionService');
  }

  private makeUnsubscribeLink(subscriptionId: string) {
    return `${this.appUrl}/api/unsubscribe/${subscriptionId}`;
  }

  public createWeatherSubscriptionHandler(frequency: Frequency) {
    return async () => {
      this.logger.info({ msg: 'Handling weather subscription has been started', frequency });

      const dataloader = new Dataloader<string, Weather>(async (cities) => {
        return await Promise.all(
          cities.map(async (city) => {
            return await this.weatherService.getWeather(city);
          }),
        );
      });

      for await (const subscriptions of this.subscriptionRepository.iterateSubscriptions(frequency)) {
        for (const { id, email, city } of subscriptions) {
          const weather = await dataloader.load(city);
          const unsubscribeLink = this.makeUnsubscribeLink(id);

          await this.emailService.sendWeatherUpdateEmail({
            to: email,
            city,
            unsubscribeLink,
            ...weather,
          });
        }
      }

      this.logger.info({ msg: 'Handling weather subscription has been finished', frequency });
    };
  }
}
