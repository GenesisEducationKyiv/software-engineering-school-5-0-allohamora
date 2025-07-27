import Dataloader from 'dataloader';
import { JwtService } from './jwt.service.js';
import { SubscriptionRepository } from 'src/repositories/subscription.repository.js';
import type { Weather } from '@weather-subscription/proto/weather';
import { Exception, Logger, LoggerService, WeatherClient, Frequency, retry } from '@weather-subscription/shared';
import { Publisher } from '@weather-subscription/queue';

const MAX_RETRIES = 3;

export type SubscribeOptions = {
  email: string;
  city: string;
  frequency: Frequency;
};

type Dependencies = {
  jwtService: JwtService;
  subscriptionRepository: SubscriptionRepository;
  weatherClient: WeatherClient;
  publisher: Publisher;
  loggerService: LoggerService;
  config: { APP_URL: string };
};

export class SubscriptionService {
  private jwtService: JwtService;
  private subscriptionRepository: SubscriptionRepository;
  private weatherClient: WeatherClient;
  private publisher: Publisher;

  private logger: Logger;

  private appUrl: string;

  constructor({
    jwtService: jwtProvider,
    subscriptionRepository,
    weatherClient,
    publisher,
    loggerService,
    config,
  }: Dependencies) {
    this.jwtService = jwtProvider;
    this.subscriptionRepository = subscriptionRepository;
    this.weatherClient = weatherClient;
    this.publisher = publisher;

    this.logger = loggerService.createLogger('SubscriptionService');

    this.appUrl = config.APP_URL;
  }

  private makeUnsubscribeLink(subscriptionId: string) {
    return `${this.appUrl}/api/unsubscribe/${subscriptionId}`;
  }

  public async handleSubscriptions(frequency: Frequency) {
    this.logger.info({ msg: 'Handling weather subscription has been started', frequency });

    const dataloader = new Dataloader<string, Weather>(async (cities) => {
      return await Promise.all(
        cities.map(async (city) => {
          const res = await this.weatherClient.getWeather({ city });

          if (!res.weather) {
            throw new Error(`Weather data for city "${city}" not found`);
          }

          return res.weather;
        }),
      );
    });

    for await (const subscriptions of this.subscriptionRepository.iterateSubscriptions(frequency)) {
      try {
        await Promise.all(
          subscriptions.map(
            retry(async ({ id, email, city }) => {
              const weather = await dataloader.load(city);
              const unsubscribeLink = this.makeUnsubscribeLink(id);

              await this.publisher.publish('send-weather-update-email', {
                to: [email],
                city,
                unsubscribeLink,
                ...weather,
              });
            }, MAX_RETRIES),
          ),
        );
      } catch (err) {
        this.logger.info({ msg: 'Handling weather subscription has been failed', err });

        break;
      }
    }

    this.logger.info({ msg: 'Handling weather subscription has been finished', frequency });
  }

  private async assertUnique(email: string) {
    const isSubscriptionExists = await this.subscriptionRepository.isSubscriptionExists(email);

    if (isSubscriptionExists) {
      throw Exception.AlreadyExists('Subscription already exists');
    }
  }

  private makeConfirmationLink(token: string) {
    return `${this.appUrl}/api/confirm/${token}`;
  }

  public async subscribe(options: SubscribeOptions) {
    await this.assertUnique(options.email);

    const { isValid } = await this.weatherClient.validateCity({ city: options.city });
    if (!isValid) {
      throw Exception.ValidationError(`City "${options.city}" is not valid`);
    }

    const token = await this.jwtService.sign(options);
    const confirmationLink = this.makeConfirmationLink(token);

    await this.publisher.publish('send-subscribe-email', {
      to: [options.email],
      city: options.city,
      confirmationLink,
    });
  }

  public async confirm(token: string) {
    const options = await this.jwtService.verify<SubscribeOptions>(token);

    await this.assertUnique(options.email);

    await this.subscriptionRepository.createSubscription(options);
  }

  public async unsubscribe(subscriptionId: string) {
    await this.subscriptionRepository.removeSubscriptionById(subscriptionId);
  }
}
