import { Server } from './server.js';
import { AppService } from '@weather-subscription/shared';
import { DbService } from './services/db.service.js';
import { Publisher } from '@weather-subscription/queue';

type Dependencies = {
  appService: AppService;
  server: Server;
  dbService: DbService;
  publisher: Publisher;
  config: { PORT: number };
};

export class App {
  public appService: AppService;
  private server: Server;

  private dbService: DbService;
  private publisher: Publisher;

  private port: number;

  constructor({ server, appService, dbService, publisher, config }: Dependencies) {
    this.appService = appService;
    this.server = server;

    this.dbService = dbService;
    this.publisher = publisher;

    this.port = config.PORT;
  }

  public async start() {
    await this.dbService.runMigrations();

    await this.publisher.connect();

    const port = await this.server.listen(this.port);

    await this.appService.start({
      port,
      stop: async () => {
        await this.server.close();

        await this.dbService.disconnectFromDb();
        await this.publisher.disconnect();
      },
    });
  }
}
