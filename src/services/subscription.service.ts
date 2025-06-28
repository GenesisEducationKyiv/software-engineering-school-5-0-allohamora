import { Frequency } from 'src/db.schema.js';
import { JwtService } from './jwt.service.js';
import { SubscriptionRepository } from 'src/repositories/subscription.repository.js';
import { Exception } from 'src/exception.js';
import { SendEmailTemplateService } from './send-email-template.service.js';
import { ConfigService } from './config.service.js';
import { WeatherService } from './weather.service.js';

export type SubscribeOptions = {
  email: string;
  city: string;
  frequency: Frequency;
};

export class SubscriptionService {
  private appUrl: string;

  constructor(
    private jwtService: JwtService,
    private subscriptionRepository: SubscriptionRepository,
    private weatherService: WeatherService,
    private sendEmailTemplateService: SendEmailTemplateService,
    configService: ConfigService,
  ) {
    this.appUrl = configService.get('APP_URL');
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
