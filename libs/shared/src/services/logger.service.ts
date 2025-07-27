import { Logger as Pino, pino } from 'pino';

type Dependencies = {
  config: { PINO_LEVEL: string };
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
        targets: [{ target: 'pino-pretty' }],
      },
    });
  }

  public createLogger(name: string): Logger {
    return this.pino.child({ name });
  }
}
