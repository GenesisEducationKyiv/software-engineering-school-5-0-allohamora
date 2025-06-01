import { config } from 'dotenv';

vitest.mock('src/config.js', () => {
  const result = config({ path: '.env.example' });
  if (result.error) {
    throw result.error;
  }

  return {
    ...result.parsed,

    NODE_ENV: 'test',

    POSTGRES_URL: 'postgres://app:example@localhost:5432/test',

    DRIZZLE_DEBUG: false,

    PINO_LEVEL: 'fatal',
  };
});
