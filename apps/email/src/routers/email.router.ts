import { Subscriber } from '@weather-subscription/queue';
import { EmailService } from 'src/services/email.service.js';

export type Dependencies = {
  subscriber: Subscriber;
  emailService: EmailService;
};

export class EmailRouter {
  private subscriber: Subscriber;
  private emailService: EmailService;

  constructor({ subscriber, emailService }: Dependencies) {
    this.subscriber = subscriber;
    this.emailService = emailService;
  }

  public async setup() {
    await this.subscriber.subscribe('send-subscribe-email', async (payload) => {
      await this.emailService.sendSubscribeEmail(payload);
    });

    await this.subscriber.subscribe('send-weather-update-email', async (payload) => {
      await this.emailService.sendWeatherUpdateEmail(payload);
    });
  }
}
