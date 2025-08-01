import { Logger, LoggerService } from '@weather-subscription/shared';
import { EmailRouter } from './routers/email.router.js';
import { Subscriber } from '@weather-subscription/queue';

type Dependencies = {
  emailRouter: EmailRouter;
  subscriber: Subscriber;
  loggerService: LoggerService;
};

export class Handler {
  private emailRouter: EmailRouter;
  private subscriber: Subscriber;

  private logger: Logger;

  constructor({ emailRouter, subscriber, loggerService }: Dependencies) {
    this.emailRouter = emailRouter;
    this.subscriber = subscriber;

    this.logger = loggerService.createLogger('Handler');
  }

  public async connect() {
    await this.subscriber.connect();

    await this.emailRouter.setup();

    await this.subscriber.run();

    this.logger.info({ msg: 'Handler has been connected' });
  }

  public async disconnect() {
    await this.subscriber.disconnect();

    this.logger.info({ msg: 'Handler has been disconnected' });
  }
}
