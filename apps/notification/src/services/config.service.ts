import { ParsedSchema, parseEnv } from 'znv';
import { z } from 'zod';
import 'dotenv/config';

const configSchema = {
  NODE_ENV: z.enum(['development', 'test', 'production']).optional().default('development'),

  PINO_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent', 'fatal']).optional().default('info'),

  SUBSCRIPTION_SERVICE_URL: z.string().url().optional().default('http://localhost:4003'),
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
