import { serve, ServerType } from '@hono/node-server';
import { NODE_ENV, PORT } from './config.js';
import { disconnectFromDb, runMigrations } from './db.js';
import { createLogger } from './libs/pino.lib.js';
import { startCron, stopCron } from './services/cron.service.js';
import { onGracefulShutdown } from './utils/graceful-shutdown.utils.js';
import { app } from './app.js';

const logger = createLogger('server');

const TIME_TO_CLOSE_BEFORE_EXIT_IN_MS = 15_000;

const setupGracefulShutdown = (server: ServerType) => {
  const gracefulShutdown = async () => {
    await new Promise((res, rej) => {
      server.close((err) => !err ? res(null) : rej(err));
    });

    await disconnectFromDb();
    await stopCron();
  };
  onGracefulShutdown(gracefulShutdown);

  const handleError = (errorName: string) => async (cause: unknown) => {
    logger.error({ err: new Error(errorName, { cause }) });

    const timeout = setTimeout(() => {
      logger.error(new Error('Graceful shutdown has been failed', { cause }));

      process.exit(1);
    }, TIME_TO_CLOSE_BEFORE_EXIT_IN_MS);

    await gracefulShutdown();
    clearTimeout(timeout);

    process.exit(1);
  };
  process.on('unhandledRejection', handleError('app has received unhandledRejection'));
  process.on('uncaughtException', handleError('app has received uncaughtException'));
}

const server = serve({ fetch: app.fetch, port: PORT }, async (info) => {
  await runMigrations();
  await startCron();

  setupGracefulShutdown(server);

  const parts = ['Server has been started'];

  if (NODE_ENV === 'development') {
    parts.push(`at http://localhost:${info.port}`);
  };

  logger.info({
    msg: parts.join(' '),
    NODE_ENV,
  });
});
