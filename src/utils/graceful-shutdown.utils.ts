import { createLogger } from 'src/libs/pino.lib.js';

const TIME_TO_CLOSE_BEFORE_EXIT_IN_MS = 15_000;

const logger = createLogger('graceful-shutdown');

export const onGracefulShutdown = (fn: () => Promise<void>) => {
  // expects sync function that returns void
  process.on('SIGTERM', (signal) => {
    logger.info({ msg: 'started', signal });

    // aws doesn't kill application after SIGTERM, because of that we need to kill it
    // to handle failed graceful-shutdown manually
    const timeout = setTimeout(() => {
      logger.error({ err: new Error('failed'), signal });
      process.exit(1);
    }, TIME_TO_CLOSE_BEFORE_EXIT_IN_MS);

    fn().then(() => {
      clearTimeout(timeout);

      logger.info({ msg: 'finished', signal });

      // we need it because we can have unpredictable timers during the graceful shutdown
      process.exit(0);
    });
  });
};
