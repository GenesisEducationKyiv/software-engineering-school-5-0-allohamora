import { Cron } from 'croner';
import { HandleSubscriptionService } from './handle-subscription.service.js';
import { Frequency } from 'src/db.schema.js';

const enum CronExpression {
  DAILY = '0 0 * * *',
  HOURLY = '0 * * * *',
}

export interface CronService {
  startCron: () => Promise<void>;
  stopCron: () => Promise<void>;
}

export class CronerCronService implements CronService {
  private crons: Cron[] = [];

  constructor(private handleSubscriptionService: HandleSubscriptionService) {}

  public async startCron() {
    this.crons.push(
      new Cron(CronExpression.DAILY, this.handleSubscriptionService.createWeatherSubscriptionHandler(Frequency.Daily)),
    );
    this.crons.push(
      new Cron(
        CronExpression.HOURLY,
        this.handleSubscriptionService.createWeatherSubscriptionHandler(Frequency.Hourly),
      ),
    );
  }

  public async stopCron() {
    for (const cron of this.crons) {
      cron.stop();
    }
    this.crons = [];
  }
}
