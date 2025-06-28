import { CacheService } from 'src/services/cache.service.js';
import { Weather, WeatherProvider } from './weather.provider.js';
import { Exception, ExceptionCode } from 'src/exception.js';

type Options = {
  cacheService: CacheService;
  config: { WEATHER_TTL_SECONDS: number };
};

export class CacheWeatherProviderProxy implements WeatherProvider {
  private weatherProvider: WeatherProvider;
  private cacheService: CacheService;

  private weatherTtlSeconds: number;

  constructor(weatherProvider: WeatherProvider, { cacheService, config }: Options) {
    this.weatherProvider = weatherProvider;
    this.cacheService = cacheService;

    this.weatherTtlSeconds = config.WEATHER_TTL_SECONDS;
  }

  private toWeatherCacheKey(city: string) {
    return `weather:${city.toLowerCase()}`;
  }

  public async getWeather(city: string) {
    const cacheKey = this.toWeatherCacheKey(city);
    const cachedWeather = await this.cacheService.get<Weather>(cacheKey);
    if (cachedWeather) {
      return cachedWeather;
    }

    const weather = await this.weatherProvider.getWeather(city);
    await this.cacheService.set(cacheKey, weather, this.weatherTtlSeconds);

    return weather;
  }

  private toValidateCacheKey(city: string) {
    return `weather:validate:${city.toLowerCase()}`;
  }

  public async validateCity(city: string) {
    const cacheKey = this.toValidateCacheKey(city);
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
}
