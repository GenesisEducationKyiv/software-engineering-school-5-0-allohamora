import { ParsedSchema, parseEnv } from 'znv';
import { z } from 'zod';
import 'dotenv/config';

const configSchema = {
  NODE_ENV: z.enum(['development', 'test', 'production']).optional().default('development'),
  PORT: z.number().optional().default(4001),

  REDIS_URL: z.string().url(),

  WEATHER_API_KEY: z.string(),

  PINO_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent', 'fatal']).optional().default('info'),

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

  public getConfig(): Config {
    return this.config;
  }
}
