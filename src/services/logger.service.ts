import { LevelWithSilentOrString, Logger as Pino, pino } from 'pino';

export type Logger = {
  info: (data: { msg: string } & Record<string, unknown>) => void;
  error: (data: { err: Error | unknown } & Record<string, unknown>) => void;
};

export interface LoggerService {
  createLogger: (name: string) => Logger;
}

export class PinoLoggerService implements LoggerService {
  private pino: Pino;

  constructor(level: LevelWithSilentOrString) {
    this.pino = pino({
      level,
      transport: {
        targets: [{ target: 'pino-pretty' }],
      },
    });
  }

  public createLogger(name: string): Logger {
    return this.pino.child({ name });
  }
}
