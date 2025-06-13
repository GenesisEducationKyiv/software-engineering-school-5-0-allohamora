import { Frequency } from 'src/db.schema.js';
import { JwtService } from './jwt.service.js';
import { SubscriptionRepository } from 'src/repositories/subscription.repository.js';
import { APP_URL } from 'src/config.js';
import { Exception, ExceptionCode } from 'src/exception.js';
import { WeatherService } from './weather.service.js';
import { SendEmailTemplateService } from './send-email-template.service.js';

export type SubscribeOptions = {
  email: string;
  city: string;
  frequency: Frequency;
};

export type SubscribeService = {
  subscribe: (options: SubscribeOptions) => Promise<void>;
  confirm: (token: string) => Promise<void>;
  unsubscribe: (subscriptionId: string) => Promise<void>;
};

export class WeatherSubscribeService implements SubscribeService {
  constructor(
    private jwtService: JwtService,
    private subscriptionRepository: SubscriptionRepository,
    private weatherService: WeatherService,
    private sendEmailTemplateService: SendEmailTemplateService,
  ) {}

  private async checkIsSubscriptionExists(email: string) {
    if (await this.subscriptionRepository.isSubscriptionExists(email)) {
      throw new Exception(ExceptionCode.ALREADY_EXISTS, 'Subscription already exists');
    }
  }

  public async subscribe(options: SubscribeOptions) {
    await this.checkIsSubscriptionExists(options.email);

    await this.weatherService.validateCity(options.city);

    const token = await this.jwtService.sign(options);
    const confirmationLink = `${APP_URL}/api/confirm/${token}`;

    await this.sendEmailTemplateService.sendSubscribeEmail({
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
}
