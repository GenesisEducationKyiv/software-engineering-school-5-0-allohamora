import { Cron } from 'croner';
import { CronJob, CronProvider } from 'src/domain/ports/cron.provider.js';

export class CronerCronProvider implements CronProvider {
  private jobs: CronJob[] = [];
  private crons: Cron[] = [];

  public addJob(job: CronJob) {
    this.jobs.push(job);
  }

  public startJobs() {
    for (const job of this.jobs) {
      this.crons.push(new Cron(job.pattern, job.handler));
    }
  }

  public stopJobs() {
    for (const cron of this.crons) {
      cron.stop();
    }

    this.crons = [];
  }
}
