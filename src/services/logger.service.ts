import { pino } from 'pino';
import { PINO_LEVEL } from 'src/config.js';

export type Logger = {
  info: (data: { msg: string } & Record<string, unknown>) => void;
  error: (data: { err: Error | unknown } & Record<string, unknown>) => void;
};

export type LoggerService = {
  createLogger: (name: string) => Logger;
};

export class PinoLoggerService implements LoggerService {
  private pino = pino({
    level: PINO_LEVEL,
    transport: {
      targets: [
        {
          target: 'pino-pretty',
        },
      ],
    },
  });

  public createLogger(name: string): Logger {
    return this.pino.child({ name });
  }
}
