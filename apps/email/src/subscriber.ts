import { EmailRouter } from './routers/email.router.js';
import { SubscribeService } from '@weather-subscription/queue';

type Dependencies = {
  emailRouter: EmailRouter;
  subscribeService: SubscribeService;
};

export class Subscriber {
  private emailRouter: EmailRouter;
  private subscribeService: SubscribeService;

  constructor({ emailRouter, subscribeService }: Dependencies) {
    this.emailRouter = emailRouter;
    this.subscribeService = subscribeService;
  }

  public async connect() {
    await this.subscribeService.connect();

    await this.emailRouter.setup();

    await this.subscribeService.run();
  }

  public async disconnect() {
    await this.subscribeService.disconnect();
  }
}
