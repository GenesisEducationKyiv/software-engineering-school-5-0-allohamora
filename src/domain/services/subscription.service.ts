import Dataloader from 'dataloader';
import { Exception } from 'src/domain/entities/exception.entity.js';
import { WeatherService } from './weather.service.js';
import { JwtProvider } from '../ports/secondary/jwt.provider.js';
import { SubscriptionRepository } from 'src/domain/ports/secondary/subscription.repository.js';
import { Frequency } from '../entities/subscription.entity.js';
import { EmailProvider } from 'src/domain/ports/secondary/email.provider.js';
import { TemplateProvider } from '../ports/secondary/templates.provider.js';
import { Logger, LoggerProvider } from '../ports/secondary/logger.provider.js';
import { Weather } from '../entities/weather.entity.js';
import { CronExpression, CronProvider } from '../ports/secondary/cron.provider.js';

export type SubscribeOptions = {
  email: string;
  city: string;
  frequency: Frequency;
};

type Options = {
  jwtProvider: JwtProvider;
  subscriptionRepository: SubscriptionRepository;
  weatherService: WeatherService;
  emailProvider: EmailProvider;
  templateProvider: TemplateProvider;
  cronProvider: CronProvider;
  loggerProvider: LoggerProvider;
  config: { APP_URL: string };
};

export class SubscriptionService {
  private jwtProvider: JwtProvider;
  private subscriptionRepository: SubscriptionRepository;
  private weatherService: WeatherService;
  private emailProvider: EmailProvider;
  private templateProvider: TemplateProvider;
  private cronProvider: CronProvider;
  private logger: Logger;

  private appUrl: string;

  constructor({
    jwtProvider,
    subscriptionRepository,
    weatherService,
    emailProvider,
    templateProvider,
    cronProvider,
    loggerProvider,
    config,
  }: Options) {
    this.jwtProvider = jwtProvider;
    this.subscriptionRepository = subscriptionRepository;
    this.weatherService = weatherService;
    this.emailProvider = emailProvider;
    this.templateProvider = templateProvider;
    this.cronProvider = cronProvider;

    this.logger = loggerProvider.createLogger('SubscriptionService');

    this.appUrl = config.APP_URL;

    this.setupJobs();
  }

  private setupJobs() {
    this.cronProvider.addJob({
      pattern: CronExpression.DAILY,
      handler: this.createWeatherSubscriptionHandler(Frequency.Daily),
    });

    this.cronProvider.addJob({
      pattern: CronExpression.HOURLY,
      handler: this.createWeatherSubscriptionHandler(Frequency.Hourly),
    });
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

          await this.emailProvider.sendEmail({
            to: [email],
            template: this.templateProvider.getWeatherUpdateTemplate({
              city,
              unsubscribeLink,
              ...weather,
            }),
          });
        }
      }

      this.logger.info({ msg: 'Handling weather subscription has been finished', frequency });
    };
  }

  private async assertIsSubscriptionExists(email: string) {
    const isSubscriptionExists = await this.subscriptionRepository.isSubscriptionExists(email);

    if (isSubscriptionExists) {
      throw Exception.AlreadyExists('Subscription already exists');
    }
  }

  private makeConfirmationLink(token: string) {
    return `${this.appUrl}/api/confirm/${token}`;
  }

  public async subscribe(options: SubscribeOptions) {
    await this.assertIsSubscriptionExists(options.email);

    await this.weatherService.validateCity(options.city);

    const token = await this.jwtProvider.sign(options);
    const confirmationLink = this.makeConfirmationLink(token);

    await this.emailProvider.sendEmail({
      to: [options.email],
      template: this.templateProvider.getSubscribeTemplate({
        city: options.city,
        confirmationLink,
      }),
    });
  }

  public async confirm(token: string) {
    const options = await this.jwtProvider.verify<SubscribeOptions>(token);

    await this.assertIsSubscriptionExists(options.email);

    await this.subscriptionRepository.createSubscription(options);
  }

  public async unsubscribe(subscriptionId: string) {
    await this.subscriptionRepository.removeSubscriptionById(subscriptionId);
  }
}
