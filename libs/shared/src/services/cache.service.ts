import { Redis } from 'ioredis';
import { Counter, MetricsService } from './metrics.service.js';
import { Logger, LoggerService } from './logger.service.js';

type Dependencies = {
  metricsService: MetricsService;
  loggerService: LoggerService;
  config: { REDIS_URL: string };
};

type GetOrComputeOptions<T> = {
  key: string;
  ttlSeconds: number;
  compute: () => Promise<T>;
};

export class CacheService {
  private hitCounter: Counter;
  private missCounter: Counter;

  private redis: Redis;

  private logger: Logger;

  constructor({ metricsService, config, loggerService }: Dependencies) {
    this.hitCounter = metricsService.getCounter('cache_hits', 'Number of cache hits', ['key']);

    this.missCounter = metricsService.getCounter('cache_misses', 'Number of cache misses', ['key']);

    this.redis = new Redis(config.REDIS_URL);

    this.logger = loggerService.createLogger('CacheService');
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

  public async getOrCompute<T>({ key, ttlSeconds, compute }: GetOrComputeOptions<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) return cached;

    const result = await compute();
    await this.set(key, result, ttlSeconds);

    return result;
  }

  public async clearAll() {
    this.logger.warn({ msg: 'Clearing all cache data' });

    await this.redis.flushdb();
  }
}
