import { Cron } from 'croner';
import { HandleSubscriptionService } from './handle-subscription.service.js';
import { Frequency } from 'src/db.schema.js';

const enum CronExpression {
  DAILY = '0 0 * * *',
  HOURLY = '0 * * * *',
}

type Options = {
  handleSubscriptionService: HandleSubscriptionService;
};

export class CronService {
  private crons: Cron[] = [];

  private handleSubscriptionService: HandleSubscriptionService;

  constructor({ handleSubscriptionService }: Options) {
    this.handleSubscriptionService = handleSubscriptionService;
  }

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
