import { ConfigProvider } from './providers/config.provider.js';
import { PinoLoggerProvider } from './providers/logger.provider.js';
import { MetricsProvider } from './providers/metrics.provider.js';
import { LoggerHttpProviderDecorator } from './providers/http/logger.provider.js';
import { FetchHttpProvider } from './providers/http/fetch.provider.js';
import { DbProvider } from './providers/db.provider.js';
import { CacheProvider } from './providers/cache.provider.js';
import { DrizzleSubscriptionRepository } from './repositories/subscription.repository.js';
import { FastJwtProvider } from './providers/jwt.provider.js';
import { ApiWeatherProvider } from './providers/weather/api-weather.provider.js';
import { OpenMeteoProvider } from './providers/weather/open-meteo.provider.js';
import { CacheWeatherProviderProxy } from './providers/weather/cache.provider.js';
import { WeatherService } from 'src/domain/services/weather.service.js';
import { JsxTemplateProvider } from './providers/template.provider.js';
import { ResendEmailProvider } from './providers/email.provider.js';
import { HandleSubscriptionService } from 'src/domain/services/handle-subscription.service.js';
import { SubscriptionService } from 'src/domain/services/subscription.service.js';
import { CronService } from 'src/domain/services/cron.service.js';
import { CronerCronProvider } from './providers/cron.provider.js';
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

  public handleSubscriptionService = new HandleSubscriptionService(this);

  public subscriptionService = new SubscriptionService(this);

  public cronService = new CronService(this);

  public server = new Server(this);

  public app = new App(this);
}
