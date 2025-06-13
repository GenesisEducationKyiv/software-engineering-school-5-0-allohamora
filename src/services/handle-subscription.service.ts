import { Frequency } from 'src/db.schema.js';
import { SubscriptionRepository } from 'src/repositories/subscription.repository.js';
import { WeatherService } from './weather.service.js';
import { SendEmailTemplateService } from './send-email-template.service.js';
import { Logger } from './logger.service.js';

export type HandleSubscriptionService = {
  handleWeatherSubscription: (frequency: Frequency) => () => Promise<void>;
};

export class WeatherHandleSubscriptionService implements HandleSubscriptionService {
  constructor(
    private subscriptionRepository: SubscriptionRepository,
    private weatherService: WeatherService,
    private sendEmailTemplateService: SendEmailTemplateService,
    private logger: Logger,
    private appUrl: string,
  ) {}

  private makeUnsubscribeLink(subscriptionId: string) {
    return `${this.appUrl}/api/unsubscribe/${subscriptionId}`;
  }

  public handleWeatherSubscription(frequency: Frequency) {
    return async () => {
      this.logger.info({ msg: 'Handling weather subscription has been started', frequency });

      for await (const subscriptions of this.subscriptionRepository.iterateSubscriptions(frequency)) {
        for (const { id, email, city } of subscriptions) {
          const weather = await this.weatherService.getWeather(city);
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
