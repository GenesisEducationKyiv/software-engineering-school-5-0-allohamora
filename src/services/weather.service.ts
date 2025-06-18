import { Exception, ExceptionCode } from 'src/exception.js';
import { Weather, WeatherProvider } from 'src/providers/weather/weather.provider.js';
import { Logger } from './logger.service.js';

export interface WeatherService {
  getWeather: (city: string) => Promise<Weather>;
  validateCity: (city: string) => Promise<void>;
}

export class ChainWeatherService implements WeatherService {
  constructor(
    private providers: WeatherProvider[],
    private logger: Logger,
  ) {}

  private async chain<T>(fn: (provider: WeatherProvider) => T) {
    for (const provider of this.providers) {
      try {
        return await fn(provider);
      } catch (err) {
        if (err instanceof Exception && err.code !== ExceptionCode.INTERNAL_SERVER_ERROR) {
          throw err;
        }

        this.logger.error({ err });
        continue;
      }
    }

    throw new Exception(ExceptionCode.INTERNAL_SERVER_ERROR, 'Failed to execute chain of providers');
  }

  public async getWeather(city: string): Promise<Weather> {
    return await this.chain(async (provider) => await provider.getWeather(city));
  }

  public async validateCity(city: string): Promise<void> {
    return await this.chain(async (provider) => await provider.validateCity(city));
  }
}
