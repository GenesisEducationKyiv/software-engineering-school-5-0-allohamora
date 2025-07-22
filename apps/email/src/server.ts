import { createServer } from 'nice-grpc';
import { grpcErrorMiddleware } from '@weather-subscription/shared';
import { EmailRouter } from './routers/email.router.js';

type Dependencies = {
  emailRouter: EmailRouter;
};

export class Server {
  private emailRouter: EmailRouter;

  private server = createServer();

  constructor({ emailRouter }: Dependencies) {
    this.emailRouter = emailRouter;

    this.setup();
  }

  private setup() {
    this.server = this.server.use(grpcErrorMiddleware);

    this.emailRouter.setup(this.server);
  }

  public async listen(port: number) {
    return await this.server.listen(`0.0.0.0:${port}`);
  }

  public async close() {
    await this.server.shutdown();
  }
}
