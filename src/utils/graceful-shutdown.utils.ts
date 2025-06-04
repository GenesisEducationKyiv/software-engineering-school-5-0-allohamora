import { createLogger } from 'src/libs/pino.lib.js';

const TIME_TO_CLOSE_BEFORE_EXIT_IN_MS = 15_000;

const logger = createLogger('graceful-shutdown');

export const onGracefulShutdown = (fn: () => Promise<void>) => {
  // expects sync listener that returns void
  process.on('SIGTERM', (signal) => {
    logger.info({ msg: 'started', signal });

    // aws doesn't kill application after SIGTERM, because of that we need to kill it
    // to handle failed graceful-shutdown manually
    const timeout = setTimeout(() => {
      logger.error({ err: new Error('failed'), signal });
      process.exit(1);
    }, TIME_TO_CLOSE_BEFORE_EXIT_IN_MS);

    const handler = async () => {
      try {
        await fn();

        clearTimeout(timeout);
        process.exit(0);
      } catch (err) {
        logger.error({ err, signal });

        clearTimeout(timeout);
        process.exit(1);
      }
    };

    void handler();
  });
};
