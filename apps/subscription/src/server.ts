import { createServer, Status, ServerError } from 'nice-grpc';
import { SubscriptionService } from './services/subscription.service.js';
import { Exception } from './exception.js';
import { LoggerService } from './services/logger.service.js';
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
    this.server.use(async function* (call, context) {
      try {
        yield* call.next(call.request, context);
      } catch (err) {
        if (err instanceof Exception) {
          const message = err instanceof Exception ? err.message : 'internal server error';
          const statusCode = err instanceof Exception ? err.toGrpcCode(err.code) : Status.INTERNAL;

          throw new ServerError(statusCode, message);
        }

        throw new ServerError(Status.UNKNOWN, 'internal server error');
      }
    });

    makeSubscription(this.server, this.subscriptionService);
  }

  public async listen(port: number) {
    await this.server.listen(`localhost:${port}`);
  }

  public async close() {
    await this.server.shutdown();
  }
}
