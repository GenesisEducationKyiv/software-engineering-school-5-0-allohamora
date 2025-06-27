import { ParsedSchema, parseEnv } from 'znv';
import { z } from 'zod';
import 'dotenv/config';

const configSchema = {
  NODE_ENV: z.enum(['development', 'test', 'production']).optional().default('development'),
  PORT: z.number().optional().default(3000),
  APP_URL: z.string().url().optional().default('http://localhost:3000'),

  POSTGRES_URL: z.string().url(),
  DRIZZLE_DEBUG: z.boolean().optional().default(true),

  REDIS_URL: z.string().url(),

  WEATHER_API_KEY: z.string(),

  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.number(),

  PINO_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent', 'fatal']).optional().default('info'),

  RESEND_API_KEY: z.string(),

  EMAIL_NAME: z.string(),
  EMAIL_FROM: z.string().email(),

  WEATHER_TTL_SECONDS: z.number(),

  WRITE_LOGS_TO_FILES: z.boolean().default(false),
} as const;

export type Config = ParsedSchema<typeof configSchema>;

export class ConfigService {
  protected config: Config;

  constructor() {
    this.setConfig();
  }

  protected setConfig() {
    this.config = parseEnv(process.env, configSchema);
  }

  public get<T extends keyof Config>(key: T): Config[T] {
    return this.config[key];
  }
}
