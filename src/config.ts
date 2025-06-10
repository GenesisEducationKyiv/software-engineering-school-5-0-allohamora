import { parseEnv } from 'znv';
import { z } from 'zod';
import 'dotenv/config';

export const {
  NODE_ENV = 'development',
  PORT = 3000,
  APP_URL = 'http://localhost:3000',

  POSTGRES_URL,
  DRIZZLE_DEBUG = true,

  WEATHER_API_KEY,

  JWT_SECRET,
  JWT_EXPIRES_IN,

  PINO_LEVEL = 'info',

  RESEND_API_KEY,

  EMAIL_NAME,
  EMAIL_FROM,
} = parseEnv(process.env, {
  NODE_ENV: z.enum(['development', 'test', 'production']).optional(),
  PORT: z.number().optional(),
  APP_URL: z.string().url(),

  POSTGRES_URL: z.string().url(),
  DRIZZLE_DEBUG: z.boolean().optional(),

  WEATHER_API_KEY: z.string(),

  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.number(),

  PINO_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).optional(),

  RESEND_API_KEY: z.string(),

  EMAIL_NAME: z.string(),
  EMAIL_FROM: z.string().email(),
});
