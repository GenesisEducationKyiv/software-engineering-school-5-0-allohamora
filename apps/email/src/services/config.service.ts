import { BaseConfigService } from '@weather-subscription/shared';
import { ParsedSchema, parseEnv } from 'znv';
import { z } from 'zod';

const configSchema = {
  NODE_ENV: z.enum(['development', 'test', 'production']).optional().default('development'),

  PINO_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent', 'fatal']).optional().default('info'),

  NAME: z.string(),
  VERSION: z.string(),

  REDIS_URL: z.string().url(),

  RESEND_API_KEY: z.string(),

  EMAIL_NAME: z.string(),
  EMAIL_FROM: z.string().email(),
  EMAIL_IGNORE_TTL_SECONDS: z.number(),

  KAFKA_CLIENT_ID: z.string(),
  KAFKA_BROKER: z.string(),
  KAFKA_GROUP_ID: z.string(),

  PROMETHEUS_JOB_NAME: z.string(),
  PROMETHEUS_PUSHGATEWAY_URL: z.string().url(),
  PROMETHEUS_PUSH_DELAY: z.number(),

  LOKI_HOST: z.string().url(),
} as const;

export type Config = ParsedSchema<typeof configSchema>;

export class ConfigService extends BaseConfigService<Config> {
  protected setConfig(): void {
    this.config = parseEnv(process.env, configSchema);
  }
}
