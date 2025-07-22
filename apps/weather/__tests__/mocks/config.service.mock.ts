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

        REDIS_URL: 'redis://:example@localhost:6379/1',

        PINO_LEVEL: 'fatal',

        WRITE_LOGS_TO_FILES: false,
      } as Config;
    }
  }

  return { ConfigService: MockConfigService };
});
