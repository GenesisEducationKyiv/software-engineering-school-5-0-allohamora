import { Redis } from 'ioredis';
import { Counter, MetricsProvider } from './metrics.provider.js';

type Options = {
  metricsProvider: MetricsProvider;
  config: { REDIS_URL: string };
};

export class CacheProvider {
  private hitCounter: Counter;
  private missCounter: Counter;

  private redis: Redis;

  constructor({ metricsProvider: metricsService, config }: Options) {
    this.hitCounter = metricsService.getCounter('cache_hits', 'Number of cache hits', ['key']);

    this.missCounter = metricsService.getCounter('cache_misses', 'Number of cache misses', ['key']);

    this.redis = new Redis(config.REDIS_URL);
  }

  public async get<T>(key: string): Promise<T | null> {
    const jsonValue = await this.redis.get(key);
    if (jsonValue === null) {
      this.missCounter.inc({ key });
      return null;
    }

    this.hitCounter.inc({ key });

    return JSON.parse(jsonValue);
  }

  public async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const jsonValue = JSON.stringify(value);

    await this.redis.set(key, jsonValue, 'EX', ttlSeconds);
  }

  public async clearAll() {
    await this.redis.flushdb();
  }
}
