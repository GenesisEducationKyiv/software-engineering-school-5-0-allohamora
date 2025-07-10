import { Cron } from 'croner';
import { Frequency } from '@weather-subscription/proto/subscription';

export const enum CronExpression {
  DAILY = '0 0 * * *',
  HOURLY = '0 * * * *',
}

export interface SubscriptionClientHTTP {
  handleSubscriptions: ({ frequency }: { frequency: string }) => Promise<void>;
}

export class CronService {
  private subscriptionClient: SubscriptionClientHTTP;
  private crons: Cron[] = [];

  constructor({ subscriptionClient }: { subscriptionClient: SubscriptionClientHTTP }) {
    this.subscriptionClient = subscriptionClient;
  }

  public startJobs() {
    this.crons.push(
      new Cron(CronExpression.DAILY, async () => {
        await this.subscriptionClient.handleSubscriptions({ frequency: Frequency.DAILY.toString() });
      }),
    );

    this.crons.push(
      new Cron(CronExpression.HOURLY, async () => {
        await this.subscriptionClient.handleSubscriptions({ frequency: Frequency.HOURLY.toString() });
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
