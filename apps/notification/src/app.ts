import { AppService } from '@weather-subscription/shared';
import { CronService } from './services/cron.service.js';

type Dependencies = {
  appService: AppService;
  cronService: CronService;
};

export class App {
  private appService: AppService;
  private cronService: CronService;

  constructor({ appService, cronService }: Dependencies) {
    this.appService = appService;
    this.cronService = cronService;
  }

  public async start() {
    this.cronService.startJobs();

    await this.appService.start({
      stop: () => {
        this.cronService.stopJobs();
      },
    });
  }
}
