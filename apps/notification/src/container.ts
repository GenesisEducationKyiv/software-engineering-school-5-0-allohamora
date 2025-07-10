import { ConfigService } from 'src/services/config.service.js';
import { LoggerService } from '@weather-subscription/shared';
import { CronService } from './services/cron.service.js';
import { App } from './app.js';
// import { createChannel, createClient } from 'nice-grpc';
// import { SubscriptionServiceDefinition } from '@weather-subscription/proto/subscription';

export class Container {
  public configService = new ConfigService();
  public config = this.configService.getConfig();

  public loggerService = new LoggerService(this);

  public subscriptionClient = {
    handleSubscriptions: async ({ frequency }: { frequency: string }) => {
      await fetch(`${this.config.SUBSCRIPTION_SERVICE_URL}/subscription/handle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frequency }),
      });
    },
  };

  public cronService = new CronService(this);

  public app = new App(this);
}
