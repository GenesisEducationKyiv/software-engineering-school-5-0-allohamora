import { Server } from './server.js';
import { promisify } from 'node:util';
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

  constructor({ appService, server, config }: Dependencies) {
    this.appService = appService;
    this.server = server;

    this.port = config.PORT;
  }

  public async start() {
    const { info, server } = await this.server.serve(this.port);

    await this.appService.start({
      port: info.port,
      stop: async () => {
        await promisify<void>((cb) => server.close(cb))();
      },
    });
  }
}
