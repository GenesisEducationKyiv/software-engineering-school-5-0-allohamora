import { ConfigService } from 'src/services/config.service.js';
import {
  LoggerService,
  MetricsService,
  CacheService,
  GrpcService,
  GrpcMetricsService,
  CacheMetricsService,
  AppService,
} from '@weather-subscription/shared';
import { LoggerHttpProviderDecorator } from './providers/http/logger.provider.js';
import { FetchHttpProvider } from './providers/http/fetch.provider.js';
import { ApiWeatherProvider } from './providers/weather/api-weather.provider.js';
import { OpenMeteoProvider } from './providers/weather/open-meteo.provider.js';
import { CachedWeatherProviderProxy } from './providers/weather/cached.provider.js';
import { WeatherService } from './services/weather.service.js';
import { WeatherRouter } from './routers/weather.router.js';
import { Server } from './server.js';
import { App } from './app.js';

export class Container {
  public configService = new ConfigService();
  public config = this.configService.getConfig();

  public loggerService = new LoggerService(this);

  public metricsService = new MetricsService(this);

  public grpcMetricsService = new GrpcMetricsService(this);

  public cacheMetricsService = new CacheMetricsService(this);

  public httpProvider = new LoggerHttpProviderDecorator(new FetchHttpProvider(), this);

  public cacheService = new CacheService(this);

  public weatherProviders = [new ApiWeatherProvider(this), new OpenMeteoProvider(this)].map(
    (provider) => new CachedWeatherProviderProxy(provider, this),
  );

  public weatherService = new WeatherService(this);

  public weatherRouter = new WeatherRouter(this);

  public grpcService = new GrpcService(this);

  public server = new Server(this);

  public appService = new AppService(this);

  public app = new App(this);
}
