import { Logger as Pino, pino } from 'pino';
import { Logger, LoggerProvider } from 'src/domain/ports/secondary/logger.provider.js';

type Dependencies = {
  config: { PINO_LEVEL: string };
};

export class PinoLoggerProvider implements LoggerProvider {
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
