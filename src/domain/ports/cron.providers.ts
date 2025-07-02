export const enum CronExpression {
  DAILY = '0 0 * * *',
  HOURLY = '0 * * * *',
}

export type CronJob = {
  pattern: CronExpression;
  handler: () => Promise<void>;
};

export interface CronProvider {
  addJob: (job: CronJob) => void;
  startJobs: () => void;
  stopJobs: () => void;
}
