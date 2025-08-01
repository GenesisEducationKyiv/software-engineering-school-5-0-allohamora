import closeWithGrace, { CloseWithGraceAsyncCallback } from 'close-with-grace';
import { Server } from './server.js';
import { Logger, LoggerService } from '@weather-subscription/shared';
import { DbService } from './services/db.service.js';
import { Publisher } from '@weather-subscription/queue';

const GRACEFUL_SHUTDOWN_DELAY = 15_000;

type Dependencies = {
  server: Server;
  dbService: DbService;
  publisher: Publisher;
  loggerService: LoggerService;
  config: { PORT: number; NODE_ENV: string };
};

export class App {
  private server: Server;

  private dbService: DbService;
  private publisher: Publisher;

  private port: number;
  private nodeEnv: string;
  private logger: Logger;

  constructor({ server, dbService, publisher, loggerService, config }: Dependencies) {
    this.server = server;

    this.dbService = dbService;
    this.publisher = publisher;

    this.port = config.PORT;
    this.nodeEnv = config.NODE_ENV;

    this.logger = loggerService.createLogger('App');
  }

  private setupGracefulShutdown() {
    const gracefulShutdown: CloseWithGraceAsyncCallback = async (props) => {
      this.logger.info({ msg: 'Graceful shutdown has been started', ...props });

      await this.server.close();
      await this.dbService.disconnectFromDb();
      await this.publisher.disconnect();

      this.logger.info({ msg: 'Graceful shutdown has been finished', ...props });
    };

    closeWithGrace({ delay: GRACEFUL_SHUTDOWN_DELAY, logger: this.logger }, gracefulShutdown);
  }

  public async start() {
    await this.dbService.runMigrations();

    await this.publisher.connect();
    await this.server.listen(this.port);

    this.setupGracefulShutdown();

    this.logger.info({
      msg: `Server has been started at localhost:${this.port}`,
      NODE_ENV: this.nodeEnv,
    });
  }
}
