import closeWithGrace, { CloseWithGraceAsyncCallback } from 'close-with-grace';
import { Handler } from './handler.js';
import { Logger, LoggerService, MetricsService } from '@weather-subscription/shared';

const GRACEFUL_SHUTDOWN_DELAY = 15_000;

type Dependencies = {
  handler: Handler;
  metricsService: MetricsService;
  loggerService: LoggerService;
  config: { NODE_ENV: string };
};

export class App {
  private handler: Handler;
  private metricsService: MetricsService;

  private nodeEnv: string;
  private logger: Logger;

  constructor({ handler, metricsService, loggerService, config }: Dependencies) {
    this.handler = handler;
    this.metricsService = metricsService;

    this.nodeEnv = config.NODE_ENV;

    this.logger = loggerService.createLogger('App');
  }

  private setupGracefulShutdown() {
    const gracefulShutdown: CloseWithGraceAsyncCallback = async (props) => {
      this.logger.info({ msg: 'Graceful shutdown has been started', ...props });

      await this.handler.disconnect();
      this.metricsService.stopSendingMetrics();
      await this.metricsService.sendMetrics();

      this.logger.info({ msg: 'Graceful shutdown has been finished', ...props });
    };

    closeWithGrace({ delay: GRACEFUL_SHUTDOWN_DELAY, logger: this.logger }, gracefulShutdown);

    this.logger.info({ msg: 'Graceful shutdown has been set up', delay: GRACEFUL_SHUTDOWN_DELAY });
  }

  public async start() {
    await this.handler.connect();
    this.metricsService.startSendingMetrics();

    this.setupGracefulShutdown();

    this.logger.info({
      msg: 'Server has been started',
      NODE_ENV: this.nodeEnv,
    });
  }
}
