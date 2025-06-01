import { Logger, pino } from 'pino';
import { PINO_LEVEL } from 'src/config.js';

export type { Logger };

export const logger = pino({
  level: PINO_LEVEL,
  transport: {
    targets: [
      {
        target: 'pino-pretty',
      },
    ],
  },
});

export const createLogger = (name: string) => logger.child({ name });
