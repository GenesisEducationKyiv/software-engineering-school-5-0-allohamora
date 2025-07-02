import { Exception } from 'src/exception.js';
import { EmailService } from './email.service.js';
import { WeatherService } from './weather.service.js';
import { JwtProvider } from '../providers/jwt.provider.js';
import { SubscriptionRepository } from '../repositories/subscription.repository.js';
import { Frequency } from '../entities/subscription.entity.js';

export type SubscribeOptions = {
  email: string;
  city: string;
  frequency: Frequency;
};

type Options = {
  jwtProvider: JwtProvider;
  subscriptionRepository: SubscriptionRepository;
  weatherService: WeatherService;
  emailService: EmailService;
  config: { APP_URL: string };
};

export class SubscriptionService {
  private jwtProvider: JwtProvider;
  private subscriptionRepository: SubscriptionRepository;
  private weatherService: WeatherService;
  private emailService: EmailService;

  private appUrl: string;

  constructor({ jwtProvider, subscriptionRepository, weatherService, emailService, config }: Options) {
    this.jwtProvider = jwtProvider;
    this.subscriptionRepository = subscriptionRepository;
    this.weatherService = weatherService;
    this.emailService = emailService;

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

    await this.emailService.sendSubscribeEmail({
      to: options.email,
      city: options.city,
      confirmationLink,
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
