import { EmailRouter } from './routers/email.router.js';
import { Subscriber } from '@weather-subscription/queue';

type Dependencies = {
  emailRouter: EmailRouter;
  subscriber: Subscriber;
};

export class Handler {
  private emailRouter: EmailRouter;
  private subscriber: Subscriber;

  constructor({ emailRouter, subscriber }: Dependencies) {
    this.emailRouter = emailRouter;
    this.subscriber = subscriber;
  }

  public async connect() {
    await this.subscriber.connect();

    await this.emailRouter.setup();

    await this.subscriber.run();
  }

  public async disconnect() {
    await this.subscriber.disconnect();
  }
}
