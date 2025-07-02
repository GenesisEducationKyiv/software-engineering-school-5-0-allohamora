import { CacheProvider } from '../cache.provider.js';
import { WeatherProvider } from 'src/domain/providers/weather.provider.js';
import { Weather } from 'src/domain/entities/weather.entity.js';
import { Exception, ExceptionCode } from 'src/domain/exception.js';

type Options = {
  cacheProvider: CacheProvider;
  config: { WEATHER_TTL_SECONDS: number };
};

export class CacheWeatherProviderProxy implements WeatherProvider {
  private weatherProvider: WeatherProvider;
  private cacheProvider: CacheProvider;

  private weatherTtlSeconds: number;

  constructor(weatherProvider: WeatherProvider, { cacheProvider, config }: Options) {
    this.weatherProvider = weatherProvider;
    this.cacheProvider = cacheProvider;

    this.weatherTtlSeconds = config.WEATHER_TTL_SECONDS;
  }

  private toWeatherCacheKey(city: string) {
    return `weather:${city.toLowerCase()}`;
  }

  public async getWeather(city: string) {
    const cacheKey = this.toWeatherCacheKey(city);
    const cachedWeather = await this.cacheProvider.get<Weather>(cacheKey);
    if (cachedWeather) {
      return cachedWeather;
    }

    const weather = await this.weatherProvider.getWeather(city);
    await this.cacheProvider.set(cacheKey, weather, this.weatherTtlSeconds);

    return weather;
  }

  private toValidateCacheKey(city: string) {
    return `weather:validate:${city.toLowerCase()}`;
  }

  public async validateCity(city: string) {
    const cacheKey = this.toValidateCacheKey(city);
    const cachedValidation = await this.cacheProvider.get<boolean>(cacheKey);
    if (cachedValidation) {
      return;
    }

    if (cachedValidation === false) {
      throw new Exception(ExceptionCode.VALIDATION_ERROR, 'City not found');
    }

    try {
      await this.weatherProvider.validateCity(city);
      await this.cacheProvider.set(cacheKey, true, this.weatherTtlSeconds);
    } catch (error) {
      if (error instanceof Exception && error.code === ExceptionCode.VALIDATION_ERROR) {
        await this.cacheProvider.set(cacheKey, false, this.weatherTtlSeconds);
      }

      throw error;
    }
  }
}
