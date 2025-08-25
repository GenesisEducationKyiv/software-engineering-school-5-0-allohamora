import { Handler } from './handler.js';
import { AppService } from '@weather-subscription/shared';

type Dependencies = {
  appService: AppService;
  handler: Handler;
};

export class App {
  private appService: AppService;
  private handler: Handler;

  constructor({ appService, handler }: Dependencies) {
    this.appService = appService;
    this.handler = handler;
  }

  public async start() {
    await this.handler.connect();

    await this.appService.start({
      stop: async () => {
        await this.handler.disconnect();
      },
    });
  }
}
