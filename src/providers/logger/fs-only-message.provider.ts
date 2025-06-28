import { Logger, LoggerProvider } from './logger.provider.js';
import { join } from 'node:path';
import { appendFile } from 'node:fs/promises';
import { ConfigService } from 'src/services/config.service.js';

const TEMP_DIR = join(import.meta.dirname, '..', '..', '..', '.temp');
const FILE_PATH = join(TEMP_DIR, `${Date.now()}.txt`);

export class FsOnlyMessageLoggerProvider implements LoggerProvider {
  private isEnabled: boolean;

  constructor(configService: ConfigService) {
    this.isEnabled = configService.get('WRITE_LOGS_TO_FILES');
  }

  private async writeLog(log: string) {
    if (!this.isEnabled) {
      return;
    }

    await appendFile(FILE_PATH, log);
  }

  public createLogger() {
    return {
      info: ({ msg }) => {
        void this.writeLog(msg);
      },
      error: ({ err }) => {
        const log = err instanceof Error ? err.message : String(err);

        void this.writeLog(log);
      },
    } as Logger;
  }
}
