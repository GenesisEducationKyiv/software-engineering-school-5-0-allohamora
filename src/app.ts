import { ServerType } from '@hono/node-server';
import { NODE_ENV, PORT } from './config.js';
import { onGracefulShutdown } from './utils/graceful-shutdown.utils.js';
import { Server } from './server.js';
import { CronService } from './services/cron.service.js';
import { Logger, LoggerService } from './services/logger.service.js';
import { DbService } from './services/db.service.js';

const TIME_TO_CLOSE_BEFORE_EXIT_IN_MS = 15_000;

export type App = {
  start(): void;
};

export class CronServerApp implements App {
  private logger: Logger;

  constructor(
    private server: Server,
    private cronService: CronService,
    private loggerService: LoggerService,
    private dbService: DbService,
  ) {
    this.logger = loggerService.createLogger('App');
  }

  private setupGracefulShutdown(server: ServerType) {
    const gracefulShutdown = async () => {
      await new Promise((res, rej) => {
        server.close((err) => (!err ? res(null) : rej(err)));
      });

      await this.dbService.disconnectFromDb();
      await this.cronService.stopCron();
    };
    onGracefulShutdown(gracefulShutdown, this.loggerService.createLogger('GracefulShutdown'));

    const handleError = (errorName: string) => async (cause: unknown) => {
      this.logger.error({ err: new Error(errorName, { cause }) });

      const timeout = setTimeout(() => {
        this.logger.error({ err: new Error('Graceful shutdown has been failed', { cause }) });

        process.exit(1);
      }, TIME_TO_CLOSE_BEFORE_EXIT_IN_MS);

      await gracefulShutdown();
      clearTimeout(timeout);

      process.exit(1);
    };
    process.on('unhandledRejection', handleError('app has received unhandledRejection'));
    process.on('uncaughtException', handleError('app has received uncaughtException'));
  }

  public start() {
    this.server.serve(async (info, server) => {
      await this.dbService.runMigrations();
      await this.cronService.startCron();

      this.setupGracefulShutdown(server);

      const parts = ['Server has been started'];

      if (NODE_ENV === 'development') {
        parts.push(`at http://localhost:${info.port}`);
      }

      this.logger.info({
        msg: parts.join(' '),
        NODE_ENV,
      });
    }, PORT);
  }
}
