import { config } from 'dotenv';
import { vitest } from 'vitest';
import type { Config } from 'src/services/config.service.js';

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

        KAFKA_CLIENT_ID: 'weather-subscription-test',
        KAFKA_GROUP_ID: 'subscription-test',
      } as Config;
    }
  }

  return { ConfigService: MockConfigService };
});
