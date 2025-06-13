import closeWithGrace, { Signals } from 'close-with-grace';
import { ServerType } from '@hono/node-server';
import { NODE_ENV, PORT } from './config.js';
import { Server } from './server.js';
import { CronService } from './services/cron.service.js';
import { Logger } from './services/logger.service.js';
import { DbService } from './services/db.service.js';

const TIME_TO_CLOSE_BEFORE_EXIT_IN_MS = 15_000;

export type App = {
  start(): void;
};

export class CronServerApp implements App {
  constructor(
    private server: Server,
    private cronService: CronService,
    private dbService: DbService,
    private logger: Logger,
  ) {}

  private setupGracefulShutdown(server: ServerType) {
    const gracefulShutdown = async (signal?: Signals | 'ERROR') => {
      this.logger.info({ msg: 'Graceful shutdown has been started', signal });

      await new Promise((res, rej) => {
        server.close((err) => (!err ? res(null) : rej(err)));
      });

      await this.dbService.disconnectFromDb();
      await this.cronService.stopCron();

      this.logger.info({ msg: 'Graceful shutdown has been finished', signal });
    };

    closeWithGrace({ delay: TIME_TO_CLOSE_BEFORE_EXIT_IN_MS, logger: this.logger }, ({ signal }) =>
      gracefulShutdown(signal),
    );

    const handleError = (errorName: string) => async (cause: unknown) => {
      this.logger.error({ err: new Error(errorName, { cause }) });

      const timeout = setTimeout(() => {
        this.logger.error({ err: new Error('Graceful shutdown has been failed', { cause }) });

        process.exit(1);
      }, TIME_TO_CLOSE_BEFORE_EXIT_IN_MS);

      await gracefulShutdown('ERROR');
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
