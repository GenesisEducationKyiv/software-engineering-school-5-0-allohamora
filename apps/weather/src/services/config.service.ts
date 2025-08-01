import { ParsedSchema, parseEnv } from 'znv';
import { z } from 'zod';
import { BaseConfigService } from '@weather-subscription/shared';

const configSchema = {
  NODE_ENV: z.enum(['development', 'test', 'production']).optional().default('development'),
  PORT: z.number().optional().default(4001),

  NAME: z.string(),
  VERSION: z.string(),

  REDIS_URL: z.string().url(),

  WEATHER_API_KEY: z.string(),

  PINO_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent', 'fatal']).optional().default('info'),
  LOG_SAMPLING_RATE: z.number().optional(),

  WEATHER_TTL_SECONDS: z.number(),

  PROMETHEUS_JOB_NAME: z.string(),
  PROMETHEUS_PUSHGATEWAY_URL: z.string().url(),
  PROMETHEUS_PUSH_DELAY: z.number(),

  WRITE_LOGS_TO_FILES: z.boolean().default(false),

  LOKI_HOST: z.string().url(),
} as const;

export type Config = ParsedSchema<typeof configSchema>;

export class ConfigService extends BaseConfigService<Config> {
  protected override setConfig() {
    this.config = parseEnv(process.env, configSchema);
  }
}
