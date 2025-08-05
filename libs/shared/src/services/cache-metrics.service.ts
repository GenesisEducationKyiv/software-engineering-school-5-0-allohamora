import { Counter, MetricsService } from './metrics.service.js';

type Dependencies = {
  metricsService: MetricsService;
};

export class CacheMetricsService {
  private hitCounter: Counter;
  private missCounter: Counter;

  constructor({ metricsService }: Dependencies) {
    this.hitCounter = metricsService.createCounter({
      name: 'cache_hits',
      help: 'Number of cache hits',
      labelNames: ['key'],
    });

    this.missCounter = metricsService.createCounter({
      name: 'cache_misses',
      help: 'Number of cache misses',
      labelNames: ['key'],
    });
  }

  public increaseHitCount(data: { key: string }) {
    this.hitCounter.inc(data);
  }

  public increaseMissCount(data: { key: string }) {
    this.missCounter.inc(data);
  }
}
