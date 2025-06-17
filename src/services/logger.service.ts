import { Logger as Pino, pino } from 'pino';
import { ConfigService } from './config.service.js';

export type Logger = {
  info: (data: { msg: string } & Record<string, unknown>) => void;
  error: (data: { err: Error | unknown } & Record<string, unknown>) => void;
};

export interface LoggerService {
  createLogger: (name: string) => Logger;
}

export class PinoLoggerService implements LoggerService {
  private pino: Pino;

  constructor(configService: ConfigService) {
    this.pino = pino({
      level: configService.get('PINO_LEVEL'),
      transport: {
        targets: [{ target: 'pino-pretty' }],
      },
    });
  }

  public createLogger(name: string): Logger {
    return this.pino.child({ name });
  }
}
