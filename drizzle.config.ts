import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  schema: './src/infrastructure/db.schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  casing: 'snake_case',
  dbCredentials: {
    url: process.env.POSTGRES_URL as string,
  },
} satisfies Config;
