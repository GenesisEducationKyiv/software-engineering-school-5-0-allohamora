import { Frequency } from '../entities/subscription.entity.js';
import { NotificationService } from '../ports/primary/notification.service.js';
import { SubscriptionService } from '../ports/primary/subscription.service.js';
import { CronExpression, CronProvider } from '../ports/secondary/cron.provider.js';

type Options = {
  subscriptionService: SubscriptionService;
  cronProvider: CronProvider;
};

export class CronNotificationService implements NotificationService {
  private subscriptionService: SubscriptionService;
  private cronProvider: CronProvider;

  constructor({ subscriptionService, cronProvider }: Options) {
    this.subscriptionService = subscriptionService;
    this.cronProvider = cronProvider;
  }

  private setupJobs() {
    this.cronProvider.addJob({
      pattern: CronExpression.DAILY,
      handler: async () => await this.subscriptionService.handleSubscriptions(Frequency.Daily),
    });

    this.cronProvider.addJob({
      pattern: CronExpression.HOURLY,
      handler: async () => await this.subscriptionService.handleSubscriptions(Frequency.Hourly),
    });
  }

  public startJobs() {
    this.setupJobs();

    this.cronProvider.startJobs();
  }

  public stopJobs() {
    this.cronProvider.stopJobs();
  }
}
