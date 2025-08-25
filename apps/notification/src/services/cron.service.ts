import { Cron } from 'croner';
import { Logger, LoggerService, SubscriptionClient } from '@weather-subscription/shared';
import { Frequency } from '@weather-subscription/proto/subscription';

export const enum CronExpression {
  Daily = '0 0 * * *',
  Hourly = '0 * * * *',
}

interface Dependencies {
  subscriptionClient: SubscriptionClient;
  loggerService: LoggerService;
}

export class CronService {
  private subscriptionClient: SubscriptionClient;
  private logger: Logger;

  private crons: Cron[] = [];

  constructor({ subscriptionClient, loggerService }: Dependencies) {
    this.subscriptionClient = subscriptionClient;

    this.logger = loggerService.createLogger('CronService');
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

    this.logger.info({ msg: 'Cron jobs have been started' });
  }

  public stopJobs() {
    for (const cron of this.crons) {
      cron.stop();
    }

    this.crons = [];

    this.logger.info({ msg: 'Cron jobs have been stopped' });
  }
}
