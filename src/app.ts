import closeWithGrace, { CloseWithGraceAsyncCallback } from 'close-with-grace';
import { ServerType } from '@hono/node-server';
import { Server } from './server.js';
import { CronService } from './services/cron.service.js';
import { Logger, LoggerService } from './services/logger.service.js';
import { DbService } from './services/db.service.js';
import { promisify } from 'node:util';

const GRACEFUL_SHUTDOWN_DELAY = 15_000;

type Options = {
  server: Server;
  cronService: CronService;
  dbService: DbService;
  loggerService: LoggerService;
  config: { PORT: number; NODE_ENV: string };
};

export class App {
  private server: Server;
  private cronService: CronService;
  private dbService: DbService;

  private port: number;
  private nodeEnv: string;
  private logger: Logger;

  constructor({ server, cronService, dbService, loggerService, config }: Options) {
    this.server = server;
    this.cronService = cronService;
    this.dbService = dbService;

    this.port = config.PORT;
    this.nodeEnv = config.NODE_ENV;

    this.logger = loggerService.createLogger('App');
  }

  private setupGracefulShutdown(server: ServerType) {
    const gracefulShutdown: CloseWithGraceAsyncCallback = async (props) => {
      this.logger.info({ msg: 'Graceful shutdown has been started', ...props });

      await promisify<void>((cb) => server.close(cb))();

      await this.dbService.disconnectFromDb();
      await this.cronService.stopCron();

      this.logger.info({ msg: 'Graceful shutdown has been finished', ...props });
    };

    closeWithGrace({ delay: GRACEFUL_SHUTDOWN_DELAY, logger: this.logger }, gracefulShutdown);
  }

  public async start() {
    const { info, server } = await this.server.serve(this.port);

    await this.dbService.runMigrations();
    await this.cronService.startCron();

    this.setupGracefulShutdown(server);

    const parts = ['Server has been started'];

    if (this.nodeEnv === 'development') {
      parts.push(`at http://localhost:${info.port}`);
    }

    this.logger.info({
      msg: parts.join(' '),
      NODE_ENV: this.nodeEnv,
    });
  }
}
