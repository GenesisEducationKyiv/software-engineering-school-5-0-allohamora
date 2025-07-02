import { Exception } from 'src/domain/entities/exception.entity.js';
import { WeatherService } from './weather.service.js';
import { JwtProvider } from '../providers/jwt.provider.js';
import { SubscriptionRepository } from '../repositories/subscription.repository.js';
import { Frequency } from '../entities/subscription.entity.js';
import { EmailProvider } from '../providers/email.provider.js';
import { TemplateProvider } from '../providers/templates.provider.js';

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
  config: { APP_URL: string };
};

export class SubscriptionService {
  private jwtProvider: JwtProvider;
  private subscriptionRepository: SubscriptionRepository;
  private weatherService: WeatherService;
  private emailProvider: EmailProvider;
  private templateProvider: TemplateProvider;

  private appUrl: string;

  constructor({
    jwtProvider,
    subscriptionRepository,
    weatherService,
    emailProvider,
    templateProvider,
    config,
  }: Options) {
    this.jwtProvider = jwtProvider;
    this.subscriptionRepository = subscriptionRepository;
    this.weatherService = weatherService;
    this.emailProvider = emailProvider;
    this.templateProvider = templateProvider;

    this.appUrl = config.APP_URL;
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
