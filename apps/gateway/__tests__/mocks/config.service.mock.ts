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

        NODE_ENV: 'development',
        PORT: 3000,

        PINO_LEVEL: 'info',

        WEATHER_SERVICE_URL: 'http://localhost:4001',
        SUBSCRIPTION_SERVICE_URL: 'http://localhost:4003',
      } as Config;
    }
  }

  return { ConfigService: MockConfigService };
});
