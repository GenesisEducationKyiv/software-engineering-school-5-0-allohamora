import { ConfigService } from 'src/services/config.service.js';
import { LoggerService } from './services/logger.service.js';
import { CronService } from './services/cron.service.js';
import { App } from './app.js';
import { createChannel, createClient } from 'nice-grpc';
import { SubscriptionServiceDefinition } from '@weather-subscription/proto/subscription';

export class Container {
  public configService = new ConfigService();
  public config = this.configService.getConfig();

  public loggerService = new LoggerService(this);

  public subscriptionClient = createClient(
    SubscriptionServiceDefinition,
    createChannel(this.config.SUBSCRIPTION_SERVICE_URL),
  );

  public cronService = new CronService(this);

  public app = new App(this);
}
