import closeWithGrace, { CloseWithGraceAsyncCallback } from 'close-with-grace';
import { Server } from './server.js';
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

  private setupGracefulShutdown() {
    const gracefulShutdown: CloseWithGraceAsyncCallback = async (props) => {
      this.logger.info({ msg: 'Graceful shutdown has been started', ...props });

      await this.server.close();
      this.metricsService.stopSendingMetrics();
      await this.metricsService.sendMetrics();

      this.logger.info({ msg: 'Graceful shutdown has been finished', ...props });
    };

    closeWithGrace({ delay: GRACEFUL_SHUTDOWN_DELAY, logger: this.logger }, gracefulShutdown);
  }

  public async start() {
    await this.server.listen(this.port);
    this.metricsService.startSendingMetrics();

    this.setupGracefulShutdown();

    this.logger.info({
      msg: `Server has been started at localhost:${this.port}`,
      NODE_ENV: this.nodeEnv,
    });
  }
}
