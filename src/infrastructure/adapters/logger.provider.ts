import { Logger as Pino, pino } from 'pino';
import { Logger, LoggerProvider } from 'src/domain/ports/logger.provider.js';

type Options = {
  config: { PINO_LEVEL: string };
};

export class PinoLoggerProvider implements LoggerProvider {
  private pino: Pino;

  constructor({ config }: Options) {
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
