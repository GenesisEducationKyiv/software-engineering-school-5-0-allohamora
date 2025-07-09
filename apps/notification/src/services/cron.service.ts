import { Cron } from 'croner';
import { Client } from 'nice-grpc';
import { Frequency, SubscriptionServiceDefinition } from '@weather-subscription/proto/subscription';

export const enum CronExpression {
  DAILY = '0 0 * * *',
  HOURLY = '0 * * * *',
}

interface Dependencies {
  subscriptionClient: Client<SubscriptionServiceDefinition>;
}

export class CronService {
  private subscriptionClient: Client<SubscriptionServiceDefinition>;

  private crons: Cron[] = [];

  constructor({ subscriptionClient }: Dependencies) {
    this.subscriptionClient = subscriptionClient;
  }

  public startJobs() {
    this.crons.push(
      new Cron(CronExpression.DAILY, async () => {
        await this.subscriptionClient.handleSubscriptions({ frequency: Frequency.DAILY });
      }),
    );

    this.crons.push(
      new Cron(CronExpression.HOURLY, async () => {
        await this.subscriptionClient.handleSubscriptions({ frequency: Frequency.HOURLY });
      }),
    );
  }

  public stopJobs() {
    for (const cron of this.crons) {
      cron.stop();
    }

    this.crons = [];
  }
}
