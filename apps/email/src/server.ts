import { createServer } from 'nice-grpc';
import { EmailService } from './services/email.service.js';
import { makeEmailRoutes } from './controllers/email.controller.js';
import { grpcErrorMiddleware } from '@weather-subscription/shared';

type Options = {
  emailService: EmailService;
};

export class Server {
  private emailService: EmailService;

  private server = createServer();

  constructor({ emailService }: Options) {
    this.emailService = emailService;

    this.setup();
  }

  private setup() {
    this.server = this.server.use(grpcErrorMiddleware);

    makeEmailRoutes(this.server, this.emailService);
  }

  public async listen(port: number) {
    return await this.server.listen(`0.0.0.0:${port}`);
  }

  public async close() {
    await this.server.shutdown();
  }
}
