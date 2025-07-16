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

        EMAIL_NAME: 'Test App',
        EMAIL_FROM: 'test@example.com',
        RESEND_API_KEY: 'test_api_key',

        PINO_LEVEL: 'fatal',

        KAFKA_CLIENT_ID: 'weather-subscription-test',
        KAFKA_GROUP_ID: 'email-service-test',
      } as import('src/services/config.service.js').Config;
    }
  }

  return { ConfigService: MockConfigService };
});
