import { ParsedSchema, parseEnv } from 'znv';
import { z } from 'zod';
import { BaseConfigService } from '@weather-subscription/shared';

const configSchema = {
  NODE_ENV: z.enum(['development', 'test', 'production']).optional().default('development'),
  PORT: z.number().optional().default(4003),
  APP_URL: z.string().url().optional().default('http://localhost:3000'),

  POSTGRES_URL: z.string().url(),
  DRIZZLE_DEBUG: z.boolean().optional().default(true),

  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.number(),

  WEATHER_SERVICE_URL: z.string().url().optional().default('http://localhost:4001'),

  PINO_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent', 'fatal']).optional().default('info'),

  KAFKA_CLIENT_ID: z.string(),
  KAFKA_BROKER: z.string(),
  KAFKA_GROUP_ID: z.string(),
} as const;

export type Config = ParsedSchema<typeof configSchema>;

export class ConfigService extends BaseConfigService<Config> {
  protected override setConfig() {
    this.config = parseEnv(process.env, configSchema);
  }
}
