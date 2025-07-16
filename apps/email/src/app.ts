import closeWithGrace, { CloseWithGraceAsyncCallback } from 'close-with-grace';
import { Subscriber } from './subscriber.js';
import { Logger, LoggerService } from '@weather-subscription/shared';

const GRACEFUL_SHUTDOWN_DELAY = 15_000;

type Dependencies = {
  subscriber: Subscriber;
  loggerService: LoggerService;
  config: { NODE_ENV: string };
};

export class App {
  private subscriber: Subscriber;

  private nodeEnv: string;
  private logger: Logger;

  constructor({ subscriber, loggerService, config }: Dependencies) {
    this.subscriber = subscriber;

    this.nodeEnv = config.NODE_ENV;

    this.logger = loggerService.createLogger('App');
  }

  private setupGracefulShutdown() {
    const gracefulShutdown: CloseWithGraceAsyncCallback = async (props) => {
      this.logger.info({ msg: 'Graceful shutdown has been started', ...props });

      await this.subscriber.disconnect();

      this.logger.info({ msg: 'Graceful shutdown has been finished', ...props });
    };

    closeWithGrace({ delay: GRACEFUL_SHUTDOWN_DELAY, logger: this.logger }, gracefulShutdown);
  }

  public async start() {
    await this.subscriber.connect();

    this.setupGracefulShutdown();

    this.logger.info({
      msg: 'Server has been started',
      NODE_ENV: this.nodeEnv,
    });
  }
}
