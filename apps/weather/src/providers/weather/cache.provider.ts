import { CacheService } from 'src/services/cache.service.js';
import { Weather, WeatherProvider } from './weather.provider.js';

type Options = {
  cacheService: CacheService;
  config: { WEATHER_TTL_SECONDS: number };
};

export class CacheWeatherProviderProxy implements WeatherProvider {
  private weatherProvider: WeatherProvider;
  private cacheService: CacheService;

  private weatherTtlSeconds: number;

  constructor(weatherProvider: WeatherProvider, { cacheService: cacheProvider, config }: Options) {
    this.weatherProvider = weatherProvider;
    this.cacheService = cacheProvider;

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
      return cachedValidation;
    }

    const result = await this.weatherProvider.validateCity(city);
    await this.cacheService.set(cacheKey, result, this.weatherTtlSeconds);

    return result;
  }
}
