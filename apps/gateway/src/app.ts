import closeWithGrace, { CloseWithGraceAsyncCallback } from 'close-with-grace';
import { ServerType } from '@hono/node-server';
import { Server } from './server.js';
import { promisify } from 'node:util';
import { Logger, LoggerService } from '@weather-subscription/shared';

const GRACEFUL_SHUTDOWN_DELAY = 15_000;

type Options = {
  server: Server;
  loggerService: LoggerService;
  config: { PORT: number; NODE_ENV: string };
};

export class App {
  private server: Server;

  private port: number;
  private nodeEnv: string;
  private logger: Logger;

  constructor({ server, loggerService, config }: Options) {
    this.server = server;

    this.port = config.PORT;
    this.nodeEnv = config.NODE_ENV;

    this.logger = loggerService.createLogger('App');
  }

  private setupGracefulShutdown(server: ServerType) {
    const gracefulShutdown: CloseWithGraceAsyncCallback = async (props) => {
      this.logger.info({ msg: 'Graceful shutdown has been started', ...props });

      await promisify<void>((cb) => server.close(cb))();

      this.logger.info({ msg: 'Graceful shutdown has been finished', ...props });
    };

    closeWithGrace({ delay: GRACEFUL_SHUTDOWN_DELAY, logger: this.logger }, gracefulShutdown);
  }

  public async start() {
    const { info, server } = await this.server.serve(this.port);

    this.setupGracefulShutdown(server);

    const parts = ['Server has been started'];

    if (this.nodeEnv === 'development') {
      parts.push(`at http://localhost:${info.port}`);
    }

    this.logger.info({
      msg: parts.join(' '),
      NODE_ENV: this.nodeEnv,
    });
  }
}
