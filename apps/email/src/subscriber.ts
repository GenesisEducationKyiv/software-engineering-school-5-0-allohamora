import { EmailService } from './services/email.service.js';
import { makeEmailSubscriptions } from './controllers/email.controller.js';
import { SubscribeService } from '@weather-subscription/queue';

type Dependencies = {
  emailService: EmailService;
  subscribeService: SubscribeService;
};

export class Subscriber {
  private emailService: EmailService;
  private subscribeService: SubscribeService;

  constructor({ emailService, subscribeService }: Dependencies) {
    this.emailService = emailService;
    this.subscribeService = subscribeService;
  }

  public async connect() {
    await this.subscribeService.connect();

    await makeEmailSubscriptions(this.subscribeService, this.emailService);

    await this.subscribeService.run();
  }

  public async disconnect() {
    await this.subscribeService.disconnect();
  }
}
