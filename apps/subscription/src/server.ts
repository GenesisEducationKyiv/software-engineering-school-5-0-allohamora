import { createServer } from 'nice-grpc';
import { grpcErrorMiddleware, Logger, LoggerService } from '@weather-subscription/shared';
import { SubscriptionRouter } from './routers/subscription.router.js';

type Dependencies = {
  subscriptionRouter: SubscriptionRouter;
  loggerService: LoggerService;
};

export class Server {
  private subscriptionRouter: SubscriptionRouter;

  private logger: Logger;

  private server = createServer();

  constructor({ subscriptionRouter, loggerService }: Dependencies) {
    this.subscriptionRouter = subscriptionRouter;
    this.logger = loggerService.createLogger('Server');

    this.setup();
  }

  private setup() {
    this.server = this.server.use(grpcErrorMiddleware);

    this.subscriptionRouter.setup(this.server);

    this.logger.info({ msg: 'Server has been set up' });
  }

  public async listen(desiredPort: number) {
    const port = await this.server.listen(`0.0.0.0:${desiredPort}`);

    this.logger.info({ msg: 'Server has been started', port: desiredPort });

    return port;
  }

  public async close() {
    await this.server.shutdown();

    this.logger.info({ msg: 'Server has been closed' });
  }
}
