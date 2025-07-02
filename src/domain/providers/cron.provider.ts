export interface CronProvider {
  addJob: (pattern: string, handler: () => Promise<void>) => void;
  stopJobs: () => Promise<void>;
}
