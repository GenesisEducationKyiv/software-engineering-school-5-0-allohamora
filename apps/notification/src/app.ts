import closeWithGrace, { CloseWithGraceAsyncCallback } from 'close-with-grace';
import { Logger, LoggerService, MetricsService } from '@weather-subscription/shared';
import { CronService } from './services/cron.service.js';

const GRACEFUL_SHUTDOWN_DELAY = 15_000;

type Dependencies = {
  cronService: CronService;
  metricsService: MetricsService;
  loggerService: LoggerService;
  config: { NODE_ENV: string };
};

export class App {
  private cronService: CronService;
  private metricsService: MetricsService;

  private nodeEnv: string;

  private logger: Logger;

  constructor({ cronService, metricsService, loggerService, config }: Dependencies) {
    this.cronService = cronService;
    this.metricsService = metricsService;

    this.nodeEnv = config.NODE_ENV;

    this.logger = loggerService.createLogger('App');
  }

  private setupGracefulShutdown() {
    const gracefulShutdown: CloseWithGraceAsyncCallback = async (props) => {
      this.logger.info({ msg: 'Graceful shutdown has been started', ...props });

      this.cronService.stopJobs();
      this.metricsService.stopSendingMetrics();
      await this.metricsService.sendMetrics();

      this.logger.info({ msg: 'Graceful shutdown has been finished', ...props });
    };

    closeWithGrace({ delay: GRACEFUL_SHUTDOWN_DELAY, logger: this.logger }, gracefulShutdown);

    this.logger.info({ msg: 'Graceful shutdown has been set up', delay: GRACEFUL_SHUTDOWN_DELAY });
  }

  public async start() {
    this.cronService.startJobs();
    this.metricsService.startSendingMetrics();

    this.setupGracefulShutdown();

    this.logger.info({
      msg: 'Server has been started',
      NODE_ENV: this.nodeEnv,
    });
  }
}
