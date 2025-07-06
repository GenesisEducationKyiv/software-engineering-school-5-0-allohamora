import closeWithGrace, { CloseWithGraceAsyncCallback } from 'close-with-grace';
import { ServerType } from '@hono/node-server';
import { Server } from './server.js';
import { promisify } from 'node:util';
import { DbProvider } from 'src/secondary/adapters/db.provider.js';
import { Logger, LoggerProvider } from 'src/domain/ports/secondary/logger.provider.js';
import { NotificationService } from 'src/domain/ports/primary/notification.service.js';

const GRACEFUL_SHUTDOWN_DELAY = 15_000;

type Dependencies = {
  server: Server;
  notificationService: NotificationService;
  dbProvider: DbProvider;
  loggerProvider: LoggerProvider;
  config: { PORT: number; NODE_ENV: string };
};

export class App {
  private server: Server;
  private notificationService: NotificationService;
  private dbProvider: DbProvider;

  private port: number;
  private nodeEnv: string;
  private logger: Logger;

  constructor({ server, notificationService, dbProvider, loggerProvider, config }: Dependencies) {
    this.server = server;
    this.notificationService = notificationService;
    this.dbProvider = dbProvider;

    this.port = config.PORT;
    this.nodeEnv = config.NODE_ENV;

    this.logger = loggerProvider.createLogger('App');
  }

  private setupGracefulShutdown(server: ServerType) {
    const gracefulShutdown: CloseWithGraceAsyncCallback = async (props) => {
      this.logger.info({ msg: 'Graceful shutdown has been started', ...props });

      await promisify<void>((cb) => server.close(cb))();

      await this.dbProvider.disconnectFromDb();
      this.notificationService.stopJobs();

      this.logger.info({ msg: 'Graceful shutdown has been finished', ...props });
    };

    closeWithGrace({ delay: GRACEFUL_SHUTDOWN_DELAY, logger: this.logger }, gracefulShutdown);
  }

  public async start() {
    const { info, server } = await this.server.serve(this.port);

    await this.dbProvider.runMigrations();
    this.notificationService.startJobs();

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
