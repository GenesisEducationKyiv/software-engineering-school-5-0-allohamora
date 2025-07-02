import { ConfigProvider } from './adapters/config.provider.js';
import { PinoLoggerProvider } from './adapters/logger.provider.js';
import { MetricsProvider } from './adapters/metrics.provider.js';
import { LoggerHttpProviderDecorator } from './adapters/http/logger.provider.js';
import { FetchHttpProvider } from './adapters/http/fetch.provider.js';
import { DbProvider } from './adapters/db.provider.js';
import { CacheProvider } from './adapters/cache.provider.js';
import { DrizzleSubscriptionRepository } from './adapters/subscription.repository.js';
import { FastJwtProvider } from './adapters/jwt.provider.js';
import { ApiWeatherProvider } from './adapters/weather/api-weather.provider.js';
import { OpenMeteoProvider } from './adapters/weather/open-meteo.provider.js';
import { CacheWeatherProviderProxy } from './adapters/weather/cache.provider.js';
import { WeatherService } from 'src/domain/services/weather.service.js';
import { JsxTemplateProvider } from './adapters/template.provider.js';
import { ResendEmailProvider } from './adapters/email.provider.js';
import { SubscriptionService } from 'src/domain/services/subscription.service.js';
import { CronerCronProvider } from './adapters/cron.provider.js';
import { Server } from './server.js';
import { App } from './app.js';

export class Container {
  public configProvider = new ConfigProvider();
  public config = this.configProvider.getConfig();

  public metricsProvider = new MetricsProvider();

  public loggerProvider = new PinoLoggerProvider(this);

  public httpProvider = new LoggerHttpProviderDecorator(new FetchHttpProvider(), this);

  public dbProvider = new DbProvider(this);
  public db = this.dbProvider.getConnection();

  public cacheProvider = new CacheProvider(this);

  public jwtProvider = new FastJwtProvider(this);

  public templateProvider = new JsxTemplateProvider();

  public emailProvider = new ResendEmailProvider(this);

  public cronProvider = new CronerCronProvider();

  public subscriptionRepository = new DrizzleSubscriptionRepository(this);

  public weatherProviders = [new ApiWeatherProvider(this), new OpenMeteoProvider(this)].map(
    (provider) => new CacheWeatherProviderProxy(provider, this),
  );

  public weatherService = new WeatherService(this);

  public subscriptionService = new SubscriptionService(this);

  public server = new Server(this);

  public app = new App(this);
}
