import { ConfigService } from 'src/services/config.service.js';
import { LoggerService } from '@weather-subscription/shared';
import { LoggerHttpProviderDecorator } from './providers/http/logger.provider.js';
import { FetchHttpProvider } from './providers/http/fetch.provider.js';
import { MetricsService } from './services/metrics.service.js';
import { CacheService } from './services/cache.service.js';
import { ApiWeatherProvider } from './providers/weather/api-weather.provider.js';
import { OpenMeteoProvider } from './providers/weather/open-meteo.provider.js';
import { CacheWeatherProviderProxy } from './providers/weather/cache.provider.js';
import { WeatherService } from './services/weather.service.js';
import { Server } from './server.js';
import { App } from './app.js';

export class Container {
  public configService = new ConfigService();
  public config = this.configService.getConfig();

  public metricsService = new MetricsService();

  public loggerService = new LoggerService(this);

  public httpProvider = new LoggerHttpProviderDecorator(new FetchHttpProvider(), this);

  public cacheService = new CacheService(this);

  public weatherProviders = [new ApiWeatherProvider(this), new OpenMeteoProvider(this)].map(
    (provider) => new CacheWeatherProviderProxy(provider, this),
  );

  public weatherService = new WeatherService(this);

  public server = new Server(this);

  public app = new App(this);
}
