import Dataloader from 'dataloader';
import { Frequency } from 'src/db.schema.js';
import { SubscriptionRepository } from 'src/repositories/subscription.repository.js';
import { SendEmailTemplateService } from './send-email-template.service.js';
import { Logger, LoggerService } from './logger.service.js';
import { Weather } from 'src/providers/weather/weather.provider.js';
import { WeatherService } from './weather.service.js';

export class HandleSubscriptionService {
  private appUrl: string;

  private logger: Logger;

  constructor(
    private subscriptionRepository: SubscriptionRepository,
    private weatherService: WeatherService,
    private sendEmailTemplateService: SendEmailTemplateService,
    loggerService: LoggerService,
    config: { APP_URL: string },
  ) {
    this.appUrl = config.APP_URL;

    this.logger = loggerService.createLogger('HandleSubscriptionService');
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

          await this.sendEmailTemplateService.sendWeatherUpdateEmail({
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
