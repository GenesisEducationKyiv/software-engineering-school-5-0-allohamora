import { CacheService } from '@weather-subscription/shared';
import { WeatherProvider } from './weather.provider.js';

type Dependencies = {
  cacheService: CacheService;
  config: { WEATHER_TTL_SECONDS: number };
};

export class CachedWeatherProviderProxy implements WeatherProvider {
  private weatherProvider: WeatherProvider;
  private cacheService: CacheService;

  private weatherTtlSeconds: number;

  constructor(weatherProvider: WeatherProvider, { cacheService: cacheProvider, config }: Dependencies) {
    this.weatherProvider = weatherProvider;
    this.cacheService = cacheProvider;

    this.weatherTtlSeconds = config.WEATHER_TTL_SECONDS;
  }

  private toWeatherCacheKey(city: string) {
    return `weather:${city.toLowerCase()}`;
  }

  public async getWeather(city: string) {
    return this.cacheService.getOrCompute({
      key: this.toWeatherCacheKey(city),
      ttlSeconds: this.weatherTtlSeconds,
      compute: async () => await this.weatherProvider.getWeather(city),
    });
  }

  private toValidateCacheKey(city: string) {
    return `weather:validate:${city.toLowerCase()}`;
  }

  public async validateCity(city: string) {
    return this.cacheService.getOrCompute({
      key: this.toValidateCacheKey(city),
      ttlSeconds: this.weatherTtlSeconds,
      compute: async () => await this.weatherProvider.validateCity(city),
    });
  }
}
