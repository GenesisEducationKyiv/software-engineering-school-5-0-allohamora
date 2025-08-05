import { ConfigService } from 'src/services/config.service.js';
import { LoggerService, MetricsService, CacheService, CacheMetricsService } from '@weather-subscription/shared';
import { TemplateService } from './services/template.service.js';
import { EmailService } from './services/email.service.js';
import { KafkaProvider } from '@weather-subscription/queue';
import { Handler } from './handler.js';
import { EmailRouter } from './routers/email.router.js';
import { App } from './app.js';

export class Container {
  public configService = new ConfigService();
  public config = this.configService.getConfig();

  public loggerService = new LoggerService(this);

  public metricsService = new MetricsService(this);
  public cacheMetricsService = new CacheMetricsService(this);

  public cacheService = new CacheService(this);

  public templateService = new TemplateService();
  public emailService = new EmailService(this);

  public queueProvider = new KafkaProvider(this);
  public subscriber = this.queueProvider.createSubscriber();

  public emailRouter = new EmailRouter(this);

  public handler = new Handler(this);

  public app = new App(this);
}
