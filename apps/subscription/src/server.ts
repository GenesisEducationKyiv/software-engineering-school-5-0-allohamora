import { createServer } from 'nice-grpc';
import { SubscriptionService } from './services/subscription.service.js';
import { LoggerService, grpcErrorMiddleware } from '@weather-subscription/shared';
import { makeSubscription } from './controllers/subscription.controller.js';

type Options = {
  subscriptionService: SubscriptionService;
  loggerService: LoggerService;
};

export class Server {
  private subscriptionService: SubscriptionService;

  private server = createServer();

  constructor({ subscriptionService }: Options) {
    this.subscriptionService = subscriptionService;

    this.setup();
  }

  private setup() {
    this.server.use(grpcErrorMiddleware);

    makeSubscription(this.server, this.subscriptionService);
  }

  public async listen(port: number) {
    await this.server.listen(`localhost:${port}`);
  }

  public async close() {
    await this.server.shutdown();
  }
}
