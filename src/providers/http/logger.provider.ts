import { ConfigService } from 'src/services/config.service.js';
import { HttpProvider, GetOptions } from './http.provider.js';
import { Logger, LoggerProvider } from '../logger/logger.provider.js';

export class LoggerHttpProviderDecorator implements HttpProvider {
  private isEnabled: boolean;
  private logger: Logger;

  constructor(
    private httpProvider: HttpProvider,
    configService: ConfigService,
    loggerProvider: LoggerProvider,
  ) {
    this.isEnabled = configService.get('WRITE_LOGS_TO_FILES');

    this.logger = loggerProvider.createLogger('HttpProvider');
  }

  private async logResponse(res: Response) {
    const clone = res.clone();
    const msg = `"${clone.url} - Response: ${await clone.text()}"`;

    this.logger.info({ msg });
  }

  public async get(options: GetOptions) {
    const res = await this.httpProvider.get(options);

    if (this.isEnabled) {
      void this.logResponse(res);
    }

    return res;
  }
}
