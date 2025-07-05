import { CronService } from './services/cron.service.js';
import { SubscriptionRepository } from './repositories/subscription.repository.js';
import { JwtService } from './services/jwt.service.js';
import { HandleSubscriptionService } from './services/handle-subscription.service.js';
import { SubscriptionService } from './services/subscription.service.js';
import { Server } from './server.js';
import { App } from './app.js';
import { SendEmailService } from './services/send-email.service.js';
import { SendEmailTemplateService } from './services/send-email-template.service.js';
import { LoggerService } from './services/logger.service.js';
import { DbService } from './services/db.service.js';
import { ConfigService } from './services/config.service.js';
import { ApiWeatherProvider } from './providers/weather/api-weather.provider.js';
import { OpenMeteoProvider } from './providers/weather/open-meteo.provider.js';
import { FetchHttpProvider } from './providers/http/fetch.provider.js';
import { LoggerHttpProviderDecorator } from './providers/http/logger.provider.js';
import { HttpProvider } from './providers/http/http.provider.js';
import { CacheService } from './services/cache.service.js';
import { CachedWeatherProviderProxy } from './providers/weather/cached.provider.js';
import { WeatherService } from './services/weather.service.js';
import { MetricsService } from './services/metrics.service.js';

export class Container {
  public configService = new ConfigService();
  public config = this.configService.getConfig();

  public metricsService = new MetricsService();

  public loggerService = new LoggerService(this);

  public httpProvider: HttpProvider = new LoggerHttpProviderDecorator(new FetchHttpProvider(), this);

  public dbService = new DbService(this);
  public db = this.dbService.getConnection();

  public cacheService = new CacheService(this);

  public subscriptionRepository = new SubscriptionRepository(this);

  public jwtService = new JwtService(this);

  public weatherProviders = [new ApiWeatherProvider(this), new OpenMeteoProvider(this)].map(
    (provider) => new CachedWeatherProviderProxy(provider, this),
  );
  public weatherService = new WeatherService(this);

  public sendEmailService = new SendEmailService(this);

  public sendEmailTemplateService = new SendEmailTemplateService(this);

  public handleSubscriptionService = new HandleSubscriptionService(this);

  public subscriptionService = new SubscriptionService(this);

  public cronService = new CronService(this);

  public server = new Server(this);

  public app = new App(this);
}
