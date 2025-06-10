import { Cron } from 'croner';
import { handleWeatherSubscription } from './subscription.service.js';
import { Frequency } from 'src/db.schema.js';

const enum CronExpression {
  DAILY = '0 0 * * *',
  HOURLY = '0 * * * *',
}

const crons: Cron[] = [];

export const startCron = async () => {
  crons.push(new Cron(CronExpression.DAILY, handleWeatherSubscription(Frequency.Daily)));
  crons.push(new Cron(CronExpression.HOURLY, handleWeatherSubscription(Frequency.Hourly)));
};

export const stopCron = async () => {
  for (const cron of crons) {
    cron.stop();
  }
};
