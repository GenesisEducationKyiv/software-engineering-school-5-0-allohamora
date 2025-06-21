import { Frequency } from 'src/db.schema.js';
import { JwtService } from './jwt.service.js';
import { SubscriptionRepository } from 'src/repositories/subscription.repository.js';
import { Exception, ExceptionCode } from 'src/exception.js';
import { SendEmailTemplateService } from './send-email-template.service.js';
import { ConfigService } from './config.service.js';
import { WeatherProvider } from 'src/providers/weather/weather.provider.js';

export type SubscribeOptions = {
  email: string;
  city: string;
  frequency: Frequency;
};

export interface SubscriptionService {
  subscribe: (options: SubscribeOptions) => Promise<void>;
  confirm: (token: string) => Promise<void>;
  unsubscribe: (subscriptionId: string) => Promise<void>;
}

export class WeatherSubscriptionService implements SubscriptionService {
  private appUrl: string;

  constructor(
    private jwtService: JwtService,
    private subscriptionRepository: SubscriptionRepository,
    private weatherProvider: WeatherProvider,
    private sendEmailTemplateService: SendEmailTemplateService,
    configService: ConfigService,
  ) {
    this.appUrl = configService.get('APP_URL');
  }

  private async assertIsSubscriptionExists(email: string) {
    const isSubscriptionExists = await this.subscriptionRepository.isSubscriptionExists(email);

    if (isSubscriptionExists) {
      throw new Exception(ExceptionCode.ALREADY_EXISTS, 'Subscription already exists');
    }
  }

  private makeConfirmationLink(token: string) {
    return `${this.appUrl}/api/confirm/${token}`;
  }

  public async subscribe(options: SubscribeOptions) {
    await this.assertIsSubscriptionExists(options.email);

    await this.weatherProvider.validateCity(options.city);

    const token = await this.jwtService.sign(options);
    const confirmationLink = this.makeConfirmationLink(token);

    await this.sendEmailTemplateService.sendSubscribeEmail({
      to: options.email,
      city: options.city,
      confirmationLink,
    });
  }

  public async confirm(token: string) {
    const options = await this.jwtService.verify<SubscribeOptions>(token);

    await this.assertIsSubscriptionExists(options.email);

    await this.subscriptionRepository.createSubscription(options);
  }

  public async unsubscribe(subscriptionId: string) {
    await this.subscriptionRepository.removeSubscriptionById(subscriptionId);
  }
}
