import { Redis } from 'ioredis';
import { Logger, LoggerService } from './logger.service.js';
import { CacheMetricsService } from './cache-metrics.service.js';

type Dependencies = {
  cacheMetricsService: CacheMetricsService;
  loggerService: LoggerService;
  config: { REDIS_URL: string };
};

type GetOrComputeOptions<T> = {
  key: string;
  ttlSeconds: number;
  compute: () => Promise<T>;
};

export class CacheService {
  private cacheMetricsService: CacheMetricsService;

  private redis: Redis;

  private logger: Logger;

  constructor({ cacheMetricsService, config, loggerService }: Dependencies) {
    this.cacheMetricsService = cacheMetricsService;

    this.redis = new Redis(config.REDIS_URL);

    this.logger = loggerService.createLogger('CacheService');
  }

  public async get<T>(key: string): Promise<T | null> {
    const jsonValue = await this.redis.get(key);
    if (jsonValue === null) {
      this.cacheMetricsService.increaseMissCount({ key });
      return null;
    }

    this.cacheMetricsService.increaseHitCount({ key });

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
