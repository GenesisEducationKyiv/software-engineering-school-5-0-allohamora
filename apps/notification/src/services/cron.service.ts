import { Cron } from 'croner';
import { SubscriptionClient } from '@weather-subscription/shared';
import { Frequency } from '@weather-subscription/proto/subscription';

export const enum CronExpression {
  Daily = '0 0 * * *',
  Hourly = '0 * * * *',
}

interface Dependencies {
  subscriptionClient: SubscriptionClient;
}

export class CronService {
  private subscriptionClient: SubscriptionClient;

  private crons: Cron[] = [];

  constructor({ subscriptionClient }: Dependencies) {
    this.subscriptionClient = subscriptionClient;
  }

  public startJobs() {
    this.crons.push(
      new Cron(CronExpression.Daily, async () => {
        await this.subscriptionClient.handleSubscriptions({ frequency: Frequency.Daily });
      }),
    );

    this.crons.push(
      new Cron(CronExpression.Hourly, async () => {
        await this.subscriptionClient.handleSubscriptions({ frequency: Frequency.Hourly });
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
