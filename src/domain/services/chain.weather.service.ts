import { Exception, ExceptionCode } from 'src/domain/entities/exception.entity.js';
import { WeatherProvider } from 'src/domain/ports/secondary/weather.provider.js';
import { Logger, LoggerProvider } from '../ports/secondary/logger.provider.js';
import { Weather } from '../entities/weather.entity.js';
import { WeatherService } from '../ports/primary/weather.service.js';

type Dependencies = {
  weatherProviders: WeatherProvider[];
  loggerProvider: LoggerProvider;
};

export class ChainWeatherService implements WeatherService {
  private weatherProviders: WeatherProvider[];

  private logger: Logger;

  constructor({ weatherProviders, loggerProvider }: Dependencies) {
    this.weatherProviders = weatherProviders;

    this.logger = loggerProvider.createLogger('ChainWeatherService');
  }

  private async chain<T>(fn: (provider: WeatherProvider) => T) {
    for (const provider of this.weatherProviders) {
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
