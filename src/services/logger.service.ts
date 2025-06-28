import { Logger as Pino, pino } from 'pino';

export type Logger = {
  info: (data: { msg: string } & Record<string, unknown>) => void;
  error: (data: { err: Error | unknown } & Record<string, unknown>) => void;
};

export class LoggerService {
  private pino: Pino;

  constructor(config: { PINO_LEVEL: string }) {
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
