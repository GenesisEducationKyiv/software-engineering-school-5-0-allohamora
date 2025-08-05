import closeWithGrace from 'close-with-grace';
import { MetricsService } from './metrics.service.js';
import { Logger, LoggerService } from './logger.service.js';

const GRACEFUL_SHUTDOWN_DELAY = 15_000;

type Dependencies = {
  metricsService: MetricsService;
  loggerService: LoggerService;
  config: { NODE_ENV: string };
};

type StartOptions = {
  port?: number;
  stop: () => Promise<void> | void;
};

export class AppService {
  private metricsService: MetricsService;

  private nodeEnv: string;
  private logger: Logger;

  constructor({ metricsService, loggerService, config }: Dependencies) {
    this.metricsService = metricsService;

    this.nodeEnv = config.NODE_ENV;

    this.logger = loggerService.createLogger('AppService');
  }

  private setupGracefulShutdown(stop: StartOptions['stop']) {
    closeWithGrace({ delay: GRACEFUL_SHUTDOWN_DELAY, logger: this.logger }, async (props) => {
      this.logger.info({ msg: 'Graceful shutdown has been started', ...props });

      this.metricsService.stopSendingMetrics();
      await this.metricsService.sendMetrics();

      await stop();

      this.logger.info({ msg: 'Graceful shutdown has been finished', ...props });
    });

    this.logger.info({ msg: 'Graceful shutdown has been set up', delay: GRACEFUL_SHUTDOWN_DELAY });
  }

  private createMessage(port: StartOptions['port']) {
    if (!port) {
      return 'App has been started';
    }

    return `App has been started at http://localhost:${port}`;
  }

  public async start({ port, stop }: StartOptions) {
    this.metricsService.startSendingMetrics();

    this.setupGracefulShutdown(stop);

    this.logger.info({
      msg: this.createMessage(port),
      NODE_ENV: this.nodeEnv,
    });
  }
}
