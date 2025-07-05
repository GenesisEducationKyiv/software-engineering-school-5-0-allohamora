import { ConfigProvider } from 'src/secondary/adapters/config.provider.js';
import { PinoLoggerProvider } from 'src/secondary/adapters/logger.provider.js';
import { MetricsProvider } from 'src/secondary/adapters/metrics.provider.js';
import { LoggerHttpProviderDecorator } from 'src/secondary/adapters/http/logger.provider.js';
import { FetchHttpProvider } from 'src/secondary/adapters/http/fetch.provider.js';
import { DbProvider } from 'src/secondary/adapters/db.provider.js';
import { CacheProvider } from 'src/secondary/adapters/cache.provider.js';
import { DrizzleSubscriptionRepository } from 'src/secondary/adapters/subscription.repository.js';
import { FastJwtProvider } from 'src/secondary/adapters/jwt.provider.js';
import { ApiWeatherProvider } from 'src/secondary/adapters/weather/api-weather.provider.js';
import { OpenMeteoProvider } from 'src/secondary/adapters/weather/open-meteo.provider.js';
import { CacheWeatherProviderProxy } from 'src/secondary/adapters/weather/cache.provider.js';
import { ChainWeatherService } from 'src/domain/services/chain.weather.service.js';
import { JsxTemplateProvider } from 'src/secondary/adapters/template.provider.js';
import { ResendEmailProvider } from 'src/secondary/adapters/email.provider.js';
import { JwtSubscriptionService } from 'src/domain/services/jwt.subscription.service.js';
import { CronerCronProvider } from 'src/secondary/adapters/cron.provider.js';
import { Server } from 'src/primary/adapters/server.js';
import { App } from 'src/primary/adapters/app.js';
import { CronNotificationService } from './domain/services/cron.notification.service.js';

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

  public weatherService = new ChainWeatherService(this);

  public subscriptionService = new JwtSubscriptionService(this);

  public notificationService = new CronNotificationService(this);

  public server = new Server(this);

  public app = new App(this);
}
