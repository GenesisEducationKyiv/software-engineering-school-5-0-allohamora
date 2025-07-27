import { Logger as Pino, pino } from 'pino';

type Dependencies = {
  config: {
    NAME: string;
    VERSION: string;
    PINO_LEVEL: string;
    LOKI_HOST: string;
    LOG_SAMPLING_RATE?: number;
  };
};

type MessageHandler = (data: { msg: string } & Record<string, unknown>) => void;

export type Logger = {
  debug: MessageHandler;
  info: MessageHandler;
  warn: MessageHandler;
  error: (data: { err: Error | unknown } & Record<string, unknown>) => void;
};

export class LoggerService {
  private pino: Pino;
  private samplingRate: number;

  constructor({ config }: Dependencies) {
    this.samplingRate = config.LOG_SAMPLING_RATE ?? 1.0;

    this.pino = pino({
      level: config.PINO_LEVEL,
      transport: {
        targets: [
          { target: 'pino-pretty' },
          {
            target: 'pino-loki',
            options: { host: config.LOKI_HOST, labels: { name: config.NAME, version: config.VERSION } },
          },
        ],
      },
    });
  }

  private shouldSample(): boolean {
    return Math.random() <= this.samplingRate;
  }

  public createLogger(name: string): Logger {
    const logger = this.pino.child({ name });

    return {
      debug: (data) => {
        if (this.shouldSample()) {
          logger.debug(data);
        }
      },
      info: (data) => {
        if (this.shouldSample()) {
          logger.info(data);
        }
      },
      warn: (data) => {
        logger.warn(data);
      },
      error: (data) => {
        logger.error(data);
      },
    };
  }
}
