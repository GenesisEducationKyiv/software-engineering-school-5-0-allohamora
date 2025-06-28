import { Exception, ExceptionCode } from 'src/exception.js';
import { Logger, LoggerProvider } from 'src/providers/logger/logger.provider.js';
import { Weather, WeatherProvider } from 'src/providers/weather/weather.provider.js';

export class WeatherService {
  private logger: Logger;

  constructor(
    private providers: WeatherProvider[],
    loggerProvider: LoggerProvider,
  ) {
    this.logger = loggerProvider.createLogger('WeatherService');
  }

  private async chain<T>(fn: (provider: WeatherProvider) => T) {
    for (const provider of this.providers) {
      try {
        return await fn(provider);
      } catch (err) {
        const isBusinessException = err instanceof Exception && err.code !== ExceptionCode.INTERNAL_SERVER_ERROR;
        if (isBusinessException) {
          throw err;
        }

        this.logger.error({ err });
        continue;
      }
    }

    throw Exception.InternalServerError('Failed to execute chain of providers');
  }

  public async getWeather(city: string): Promise<Weather> {
    return await this.chain(async (provider) => await provider.getWeather(city));
  }

  public async validateCity(city: string): Promise<void> {
    return await this.chain(async (provider) => await provider.validateCity(city));
  }
}
