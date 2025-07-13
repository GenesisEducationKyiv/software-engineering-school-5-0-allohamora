import { createServer } from 'nice-grpc';
import { SubscriptionService } from './services/subscription.service.js';
import { LoggerService, grpcErrorMiddleware } from '@weather-subscription/shared';
import { makeSubscription } from './controllers/subscription.controller.js';

type Dependencies = {
  subscriptionService: SubscriptionService;
  loggerService: LoggerService;
};

export class Server {
  private subscriptionService: SubscriptionService;

  private server = createServer();

  constructor({ subscriptionService }: Dependencies) {
    this.subscriptionService = subscriptionService;

    this.setup();
  }

  private setup() {
    this.server = this.server.use(grpcErrorMiddleware);

    makeSubscription(this.server, this.subscriptionService);
  }

  public async listen(port: number) {
    return await this.server.listen(`0.0.0.0:${port}`);
  }

  public async close() {
    await this.server.shutdown();
  }
}
