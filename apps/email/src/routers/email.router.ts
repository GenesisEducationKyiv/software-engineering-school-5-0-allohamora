import { EmailService } from 'src/services/email.service.js';
import { sendSubscribeEmail, sendWeatherUpdateEmail, SubscribeService } from '@weather-subscription/queue';

export type Dependencies = {
  subscribeService: SubscribeService;
  emailService: EmailService;
};

export class EmailRouter {
  private subscribeService: SubscribeService;
  private emailService: EmailService;

  constructor({ subscribeService, emailService }: Dependencies) {
    this.subscribeService = subscribeService;
    this.emailService = emailService;
  }

  public async setup() {
    await this.subscribeService.subscribe(sendSubscribeEmail, async (payload) => {
      await this.emailService.sendSubscribeEmail(payload);
    });

    await this.subscribeService.subscribe(sendWeatherUpdateEmail, async (payload) => {
      await this.emailService.sendWeatherUpdateEmail(payload);
    });
  }
}
