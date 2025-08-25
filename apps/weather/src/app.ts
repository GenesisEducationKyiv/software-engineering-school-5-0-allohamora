import { Server } from './server.js';
import { AppService } from '@weather-subscription/shared';

type Dependencies = {
  appService: AppService;
  server: Server;
  config: { PORT: number };
};

export class App {
  private appService: AppService;
  private server: Server;

  private port: number;

  constructor({ server, appService, config }: Dependencies) {
    this.appService = appService;
    this.server = server;

    this.port = config.PORT;
  }

  public async start() {
    const port = await this.server.listen(this.port);

    await this.appService.start({
      port,
      stop: async () => {
        await this.server.close();
      },
    });
  }
}
