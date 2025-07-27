import { ParsedSchema, parseEnv } from 'znv';
import { z } from 'zod';
import { BaseConfigService } from '@weather-subscription/shared';

const configSchema = {
  NODE_ENV: z.enum(['development', 'test', 'production']).optional().default('development'),

  PINO_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent', 'fatal']).optional().default('info'),
  LOG_SAMPLING_RATE: z.number().optional(),

  NAME: z.string(),
  VERSION: z.string(),

  SUBSCRIPTION_SERVICE_URL: z.string().url().optional().default('http://localhost:4003'),

  LOKI_HOST: z.string().url(),

  PROMETHEUS_JOB_NAME: z.string(),
  PROMETHEUS_PUSHGATEWAY_URL: z.string().url(),
  PROMETHEUS_PUSH_DELAY: z.number(),
} as const;

export type Config = ParsedSchema<typeof configSchema>;

export class ConfigService extends BaseConfigService<Config> {
  protected override setConfig() {
    this.config = parseEnv(process.env, configSchema);
  }
}
