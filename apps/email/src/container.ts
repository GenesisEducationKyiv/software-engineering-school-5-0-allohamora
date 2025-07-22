import { ConfigService } from 'src/services/config.service.js';
import { LoggerService, MetricsService, CacheService } from '@weather-subscription/shared';
import { TemplateService } from './services/template.service.js';
import { EmailService } from './services/email.service.js';
import { KafkaProvider, SubscribeService } from '@weather-subscription/queue';
import { Subscriber } from './subscriber.js';
import { EmailRouter } from './routers/email.router.js';
import { App } from './app.js';

export class Container {
  public configService = new ConfigService();
  public config = this.configService.getConfig();

  public loggerService = new LoggerService(this);

  public metricsService = new MetricsService(this);

  public cacheService = new CacheService(this);

  public templateService = new TemplateService();
  public emailService = new EmailService(this);

  public queueProvider = new KafkaProvider(this);

  public subscribeService = new SubscribeService(this);

  public emailRouter = new EmailRouter(this);

  public subscriber = new Subscriber(this);

  public app = new App(this);
}
