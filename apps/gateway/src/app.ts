import closeWithGrace, { CloseWithGraceAsyncCallback } from 'close-with-grace';
import { ServerType } from '@hono/node-server';
import { Server } from './server.js';
import { promisify } from 'node:util';
import { Logger, LoggerService, MetricsService } from '@weather-subscription/shared';

const GRACEFUL_SHUTDOWN_DELAY = 15_000;

type Dependencies = {
  server: Server;
  metricsService: MetricsService;
  loggerService: LoggerService;
  config: { PORT: number; NODE_ENV: string };
};

export class App {
  private server: Server;
  private metricsService: MetricsService;

  private port: number;
  private nodeEnv: string;
  private logger: Logger;

  constructor({ server, metricsService, loggerService, config }: Dependencies) {
    this.server = server;
    this.metricsService = metricsService;

    this.port = config.PORT;
    this.nodeEnv = config.NODE_ENV;

    this.logger = loggerService.createLogger('App');
  }

  private setupGracefulShutdown(server: ServerType) {
    const gracefulShutdown: CloseWithGraceAsyncCallback = async (props) => {
      this.logger.info({ msg: 'Graceful shutdown has been started', ...props });

      await promisify<void>((cb) => server.close(cb))();
      this.metricsService.stopSendingMetrics();
      await this.metricsService.sendMetrics();

      this.logger.info({ msg: 'Graceful shutdown has been finished', ...props });
    };

    closeWithGrace({ delay: GRACEFUL_SHUTDOWN_DELAY, logger: this.logger }, gracefulShutdown);

    this.logger.info({ msg: 'Graceful shutdown has been set up', delay: GRACEFUL_SHUTDOWN_DELAY });
  }

  public async start() {
    const { info, server } = await this.server.serve(this.port);
    this.metricsService.startSendingMetrics();

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
