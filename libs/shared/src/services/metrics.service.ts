import { Logger, LoggerService } from './logger.service.js';
import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Pushgateway,
  Histogram,
  CounterConfiguration,
  HistogramConfiguration,
} from 'prom-client';

export { Counter, Histogram };

type Dependencies = {
  loggerService: LoggerService;
  config: {
    PROMETHEUS_JOB_NAME: string;
    PROMETHEUS_PUSHGATEWAY_URL: string;
    PROMETHEUS_PUSH_DELAY: number;
  };
};

export class MetricsService {
  private register = new Registry();
  private pushgateway: Pushgateway<'text/plain; version=0.0.4; charset=utf-8'>;

  private logger: Logger;

  private jobName: string;
  private pushDelay: number;
  private pushInterval: NodeJS.Timeout | null = null;

  constructor({ loggerService, config }: Dependencies) {
    collectDefaultMetrics({ register: this.register });

    this.pushgateway = new Pushgateway(config.PROMETHEUS_PUSHGATEWAY_URL, {}, this.register);

    this.logger = loggerService.createLogger('MetricsService');

    this.jobName = config.PROMETHEUS_JOB_NAME;
    this.pushDelay = config.PROMETHEUS_PUSH_DELAY;
  }

  public async sendMetrics() {
    try {
      await this.pushgateway.push({ jobName: this.jobName });
    } catch (err) {
      this.logger.error({ err });
    }
  }

  public startSendingMetrics() {
    if (this.pushInterval) {
      return;
    }

    this.pushInterval = setInterval(() => {
      void this.sendMetrics();
    }, this.pushDelay);

    this.logger.info({ msg: 'Metrics push interval has been started', pushDelay: this.pushDelay });
  }

  public stopSendingMetrics() {
    if (!this.pushInterval) {
      return;
    }

    clearInterval(this.pushInterval);
    this.pushInterval = null;

    this.logger.info({ msg: 'Metrics push interval has been stopped' });
  }

  public async collectMetrics() {
    return {
      metrics: await this.register.metrics(),
      contentType: this.register.contentType,
    };
  }

  public createCounter<T extends string>(config: CounterConfiguration<T>) {
    return new Counter({
      ...config,
      registers: [this.register],
    });
  }

  public createHistogram<T extends string>(config: HistogramConfiguration<T>) {
    return new Histogram({
      ...config,
      registers: [this.register],
    });
  }

  public clearMetrics() {
    this.logger.warn({ msg: 'Clearing all metrics data' });

    this.register.clear();
  }
}
