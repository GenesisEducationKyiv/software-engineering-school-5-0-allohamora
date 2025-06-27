import { CacheService } from 'src/services/cache.service.js';
import { Weather, WeatherProvider } from './weather.provider.js';
import { ConfigService } from 'src/services/config.service.js';
import { Exception, ExceptionCode } from 'src/exception.js';

export class CacheWeatherProviderDecorator implements WeatherProvider {
  private weatherTtlSeconds: number;

  constructor(
    private weatherProvider: WeatherProvider,
    private cacheService: CacheService,
    configService: ConfigService,
  ) {
    this.weatherTtlSeconds = configService.get('WEATHER_TTL_SECONDS');
  }

  public async getWeather(city: string) {
    const cacheKey = `weather:${city}`;
    const cachedWeather = await this.cacheService.get<Weather>(cacheKey);
    if (cachedWeather) {
      return cachedWeather;
    }

    const weather = await this.weatherProvider.getWeather(city);
    await this.cacheService.set(cacheKey, weather, this.weatherTtlSeconds);

    return weather;
  }

  public async validateCity(city: string) {
    const cacheKey = `weather:validate:${city}`;
    const cachedValidation = await this.cacheService.get<boolean>(cacheKey);
    if (cachedValidation) {
      return;
    }

    if (cachedValidation === false) {
      throw new Exception(ExceptionCode.VALIDATION_ERROR, 'City not found');
    }

    try {
      await this.weatherProvider.validateCity(city);
      await this.cacheService.set(cacheKey, true, this.weatherTtlSeconds);
    } catch (error) {
      if (error instanceof Exception && error.code === ExceptionCode.VALIDATION_ERROR) {
        await this.cacheService.set(cacheKey, false, this.weatherTtlSeconds);
      }

      throw error;
    }
  }

  public setNext(provider: WeatherProvider) {
    return this.weatherProvider.setNext(provider);
  }
}
