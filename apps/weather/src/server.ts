import { createServer } from 'nice-grpc';
import { WeatherRouter } from './routers/weather.router.js';
import { grpcErrorMiddleware } from '@weather-subscription/shared';

type Dependencies = {
  weatherRouter: WeatherRouter;
};

export class Server {
  private weatherRouter: WeatherRouter;

  private server = createServer();

  constructor({ weatherRouter }: Dependencies) {
    this.weatherRouter = weatherRouter;

    this.setup();
  }

  private setup() {
    this.server = this.server.use(grpcErrorMiddleware);

    this.weatherRouter.setup(this.server);
  }

  public async listen(port: number) {
    return await this.server.listen(`0.0.0.0:${port}`);
  }

  public async close() {
    await this.server.shutdown();
  }
}
