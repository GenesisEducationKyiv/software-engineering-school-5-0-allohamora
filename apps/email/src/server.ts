import { createServer, Status, ServerError } from 'nice-grpc';
import { EmailService } from './services/email.service.js';
import { Exception } from './exception.js';
import { makeEmailRoutes } from './controllers/email.controller.js';
import { LoggerService } from './services/logger.service.js';

type Options = {
  emailService: EmailService;
  loggerService: LoggerService;
};

export class Server {
  private emailService: EmailService;

  private server = createServer();

  constructor({ emailService }: Options) {
    this.emailService = emailService;

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

    makeEmailRoutes(this.server, this.emailService);
  }

  public async listen(port: number) {
    await this.server.listen(`localhost:${port}`);
  }

  public async close() {
    await this.server.shutdown();
  }
}
