import { config } from 'dotenv';
import { vitest } from 'vitest';

vitest.mock('src/services/config.service.js', async (importOriginal) => {
  const { ConfigService } = await importOriginal<typeof import('src/services/config.service.js')>();

  const result = config({ path: '.env.example' });
  if (result.error) {
    throw result.error;
  }
  class MockConfigService extends ConfigService {
    protected override setConfig() {
      this.config = {
        ...result.parsed,

        NODE_ENV: 'test',

        POSTGRES_URL: 'postgres://app:example@localhost:5432/test',

        JWT_SECRET: 'test-jwt-secret',

        PINO_LEVEL: 'fatal',

        DRIZZLE_DEBUG: false,
      } as import('src/services/config.service.js').Config;
    }
  }

  return { ConfigService: MockConfigService };
});
