import { GetOptions, HttpService } from 'src/services/http.service.js';
import { join } from 'node:path';
import { appendFile } from 'node:fs/promises';
import { ConfigService } from 'src/services/config.service.js';

const TEMP_DIR = join(import.meta.dirname, '..', '..', '.temp');

export class HttpLoggerProxy implements HttpService {
  private filePath = join(TEMP_DIR, `${Date.now()}.txt`);
  private isEnabled: boolean;

  constructor(
    private httpService: HttpService,
    configService: ConfigService,
  ) {
    this.isEnabled = configService.get('WRITE_LOGS_TO_FILES');
  }

  private async writeLog(log: string) {
    await appendFile(this.filePath, log);
  }

  private async logResponse(res: Response) {
    const log = `"${res.url} - Response: ${await res.text()}"`;

    await this.writeLog(log);
  }

  public async get(options: GetOptions) {
    const res = await this.httpService.get(options);

    if (this.isEnabled) {
      void this.logResponse(res.clone());
    }

    return res;
  }
}
