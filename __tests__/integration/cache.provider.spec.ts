import { ctx } from '__tests__/setup-integration-context.js';
import { CacheProvider } from 'src/secondary/adapters/cache.provider.js';
import { scheduler } from 'node:timers/promises';

describe('CacheProvider (integration)', () => {
  let cacheProvider: CacheProvider;

  beforeAll(() => {
    ({ cacheProvider } = ctx);
  });

  describe('set and get', () => {
    it('sets and gets string value', async () => {
      const key = 'test-string';
      const value = 'hello world';
      const ttl = 3600;

      await cacheProvider.set(key, value, ttl);
      const result = await cacheProvider.get<string>(key);

      expect(result).toBe(value);
    });

    it('sets and gets number value', async () => {
      const key = 'test-number';
      const value = 42;
      const ttl = 3600;

      await cacheProvider.set(key, value, ttl);
      const result = await cacheProvider.get<number>(key);

      expect(result).toBe(value);
    });

    it('sets and gets object value', async () => {
      const key = 'test-object';
      const value = { name: 'John', age: 30 };
      const ttl = 3600;

      await cacheProvider.set(key, value, ttl);
      const result = await cacheProvider.get<typeof value>(key);

      expect(result).toEqual(value);
    });

    it('returns null for non-existent key', async () => {
      const result = await cacheProvider.get<string>('non-existent');

      expect(result).toBeNull();
    });

    it('expires value after TTL', async () => {
      const key = 'test-ttl';
      const value = 'expires soon';
      const ttl = 1;

      await cacheProvider.set(key, value, ttl);

      const immediateResult = await cacheProvider.get<string>(key);
      expect(immediateResult).toBe(value);

      await scheduler.wait(ttl * 1000 + 100);

      const expiredResult = await cacheProvider.get<string>(key);
      expect(expiredResult).toBeNull();
    });
  });

  describe('clearAll', () => {
    it('clears all cached values', async () => {
      const data = Array.from({ length: 10 }, (_, i) => `test-${i}`);
      const ttl = 3600;

      await Promise.all(data.map((item) => cacheProvider.set(item, item, ttl)));

      await cacheProvider.clearAll();

      for (const item of data) {
        const result = await cacheProvider.get<string>(item);
        expect(result).toBeNull();
      }
    });
  });
});
