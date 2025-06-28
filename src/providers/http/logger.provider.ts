import { join } from 'node:path';
import { appendFile } from 'node:fs/promises';
import { HttpProvider, GetOptions } from './http.provider.js';

const TEMP_DIR = join(import.meta.dirname, '..', '..', '..', '.temp');

export class LoggerHttpProviderDecorator implements HttpProvider {
  private filePath = join(TEMP_DIR, `${Date.now()}.txt`);
  private isEnabled: boolean;

  constructor(
    private httpProvider: HttpProvider,
    config: { WRITE_LOGS_TO_FILES: boolean },
  ) {
    this.isEnabled = config.WRITE_LOGS_TO_FILES;
  }

  private async writeLog(log: string) {
    await appendFile(this.filePath, log);
  }

  private async logResponse(res: Response) {
    const clone = res.clone();
    const log = `"${clone.url} - Response: ${await clone.text()}"`;

    await this.writeLog(log);
  }

  public async get(options: GetOptions) {
    const res = await this.httpProvider.get(options);

    if (this.isEnabled) {
      void this.logResponse(res);
    }

    return res;
  }
}
