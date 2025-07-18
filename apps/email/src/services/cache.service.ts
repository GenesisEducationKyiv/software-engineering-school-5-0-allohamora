import { Redis } from 'ioredis';

type Dependencies = {
  config: { REDIS_URL: string };
};

export class CacheService {
  private redis: Redis;

  constructor({ config }: Dependencies) {
    this.redis = new Redis(config.REDIS_URL);
  }

  public async get<T>(key: string): Promise<T | null> {
    const jsonValue = await this.redis.get(key);
    if (jsonValue === null) {
      return null;
    }

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
