import { Logger as Pino, pino } from 'pino';
import { ConfigService } from 'src/services/config.service.js';
import { Logger, LoggerProvider } from './logger.provider.js';

export class PinoLoggerProvider implements LoggerProvider {
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
