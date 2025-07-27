import { Logger as Pino, pino } from 'pino';

type Dependencies = {
  config: { NAME: string; VERSION: string; PINO_LEVEL: string; LOKI_HOST: string };
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

  constructor({ config }: Dependencies) {
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

  public createLogger(name: string): Logger {
    return this.pino.child({ name });
  }
}
