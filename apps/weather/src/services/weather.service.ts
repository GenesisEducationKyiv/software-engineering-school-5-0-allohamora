import { Weather, WeatherProvider } from 'src/providers/weather/weather.provider.js';
import { Exception, Logger, LoggerService } from '@weather-subscription/shared';

type Dependencies = {
  weatherProviders: WeatherProvider[];
  loggerService: LoggerService;
};

export class WeatherService {
  private weatherProviders: WeatherProvider[];

  private logger: Logger;

  constructor({ weatherProviders, loggerService }: Dependencies) {
    this.weatherProviders = weatherProviders;

    this.logger = loggerService.createLogger('ChainWeatherService');
  }

  private async chain<T>(fn: (provider: WeatherProvider) => T) {
    for (const provider of this.weatherProviders) {
      try {
        return await fn(provider);
      } catch (err) {
        this.logger.error({ err });
        continue;
      }
    }

    throw Exception.InternalServerError('Failed to execute chain of providers');
  }

  public async getWeather(city: string): Promise<Weather> {
    return await this.chain(async (provider) => await provider.getWeather(city));
  }

  public async validateCity(city: string): Promise<boolean> {
    return await this.chain(async (provider) => await provider.validateCity(city));
  }
}
