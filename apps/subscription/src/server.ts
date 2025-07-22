import { createServer } from 'nice-grpc';
import { grpcErrorMiddleware } from '@weather-subscription/shared';
import { SubscriptionRouter } from './routers/subscription.router.js';

type Dependencies = {
  subscriptionRouter: SubscriptionRouter;
};

export class Server {
  private subscriptionRouter: SubscriptionRouter;

  private server = createServer();

  constructor({ subscriptionRouter }: Dependencies) {
    this.subscriptionRouter = subscriptionRouter;

    this.setup();
  }

  private setup() {
    this.server = this.server.use(grpcErrorMiddleware);

    this.subscriptionRouter.setup(this.server);
  }

  public async listen(port: number) {
    return await this.server.listen(`0.0.0.0:${port}`);
  }

  public async close() {
    await this.server.shutdown();
  }
}
