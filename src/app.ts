import closeWithGrace, { CloseWithGraceAsyncCallback } from 'close-with-grace';
import { ServerType } from '@hono/node-server';
import { Server } from './server.js';
import { CronService } from './services/cron.service.js';
import { Logger } from './services/logger.service.js';
import { DbService } from './services/db.service.js';

const GRACEFUL_SHUTDOWN_DELAY = 15_000;

export type App = {
  start(): Promise<void>;
};

export class CronServerApp implements App {
  constructor(
    private server: Server,
    private cronService: CronService,
    private dbService: DbService,
    private logger: Logger,
    private nodeEnv: 'development' | 'test' | 'production',
    private port: number,
  ) {}

  private setupGracefulShutdown(server: ServerType) {
    const gracefulShutdown: CloseWithGraceAsyncCallback = async (props) => {
      this.logger.info({ msg: 'Graceful shutdown has been started', ...props });

      await new Promise((res, rej) => {
        server.close((err) => (!err ? res(null) : rej(err)));
      });

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
