export const enum CronExpression {
  DAILY = '0 0 * * *',
  HOURLY = '0 * * * *',
}

export interface CronProvider {
  addJob: (pattern: CronExpression, handler: () => Promise<void>) => void;
  stopJobs: () => Promise<void>;
}
