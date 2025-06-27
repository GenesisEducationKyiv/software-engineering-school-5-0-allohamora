import { Redis } from 'ioredis';
import { ConfigService } from './config.service.js';

export class CacheService {
  private redis: Redis;

  constructor(configService: ConfigService) {
    this.redis = new Redis(configService.get('REDIS_URL'));
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
