import { Cron } from 'croner';
import { CronProvider } from 'src/domain/providers/cron.provider.js';

export class CronerCronProvider implements CronProvider {
  private crons: Cron[] = [];

  public addJob(pattern: string, handler: () => Promise<void>) {
    this.crons.push(new Cron(pattern, handler));
  }

  public async stopJobs() {
    for (const cron of this.crons) {
      cron.stop();
    }

    this.crons = [];
  }
}
