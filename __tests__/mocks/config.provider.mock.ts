import { config } from 'dotenv';

vitest.mock('src/infrastructure/providers/config.provider.js', async (importOriginal) => {
  const { ConfigProvider } = await importOriginal<typeof import('src/infrastructure/providers/config.provider.js')>();

  const result = config({ path: '.env.example' });
  if (result.error) {
    throw result.error;
  }
  class MockConfigProvider extends ConfigProvider {
    protected override setConfig() {
      this.config = {
        ...result.parsed,

        NODE_ENV: 'test',

        POSTGRES_URL: 'postgres://app:example@localhost:5432/test',

        REDIS_URL: 'redis://:example@localhost:6379/1',

        DRIZZLE_DEBUG: false,

        PINO_LEVEL: 'fatal',

        WRITE_LOGS_TO_FILES: false,
      } as import('src/infrastructure/providers/config.provider.js').Config;
    }
  }

  return { ConfigProvider: MockConfigProvider };
});
