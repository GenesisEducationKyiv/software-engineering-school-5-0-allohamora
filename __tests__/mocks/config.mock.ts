import { config } from 'dotenv';

vitest.mock('src/services/config.service.js', async (importOriginal) => {
  const { ZnvConfigService } = await importOriginal<typeof import('src/services/config.service.js')>();

  const result = config({ path: '.env.example' });
  if (result.error) {
    throw result.error;
  }
  class MockZnvConfigService extends ZnvConfigService {
    protected override setConfig() {
      this.config = {
        ...result.parsed,

        NODE_ENV: 'test',

        POSTGRES_URL: 'postgres://app:example@localhost:5432/test',

        DRIZZLE_DEBUG: false,

        PINO_LEVEL: 'fatal',
      } as import('src/services/config.service.js').Config;
    }
  }

  return { ZnvConfigService: MockZnvConfigService };
});
