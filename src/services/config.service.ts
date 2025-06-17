import { ParsedSchema, parseEnv } from 'znv';
import { z } from 'zod';
import 'dotenv/config';

const configSchema = {
  NODE_ENV: z.enum(['development', 'test', 'production']).optional().default('development'),
  PORT: z.number().optional().default(3000),
  APP_URL: z.string().url().optional().default('http://localhost:3000'),

  POSTGRES_URL: z.string().url(),
  DRIZZLE_DEBUG: z.boolean().optional().default(true),

  WEATHER_API_KEY: z.string(),

  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.number(),

  PINO_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent', 'fatal']).optional().default('info'),

  RESEND_API_KEY: z.string(),

  EMAIL_NAME: z.string(),
  EMAIL_FROM: z.string().email(),
} as const;

export type Config = ParsedSchema<typeof configSchema>;

export interface ConfigService {
  get<T extends keyof Config>(key: T): Config[T];
  getConfig(): Config;
}

export class ZnvConfigService implements ConfigService {
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

  public getConfig(): Config {
    return this.config;
  }
}
