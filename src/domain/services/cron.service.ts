import { Frequency } from '../entities/subscription.entity.js';
import { CronProvider, CronExpression } from '../providers/cron.provider.js';
import { HandleSubscriptionService } from './handle-subscription.service.js';

type Options = {
  cronProvider: CronProvider;
  handleSubscriptionService: HandleSubscriptionService;
};

export class CronService {
  private handleSubscriptionService: HandleSubscriptionService;
  private cronProvider: CronProvider;

  constructor({ cronProvider, handleSubscriptionService }: Options) {
    this.handleSubscriptionService = handleSubscriptionService;
    this.cronProvider = cronProvider;
  }

  public async startCron() {
    this.cronProvider.addJob(
      CronExpression.DAILY,
      this.handleSubscriptionService.createWeatherSubscriptionHandler(Frequency.Daily),
    );
    this.cronProvider.addJob(
      CronExpression.HOURLY,
      this.handleSubscriptionService.createWeatherSubscriptionHandler(Frequency.Hourly),
    );
  }

  public async stopCron() {
    this.cronProvider.stopJobs();
  }
}
