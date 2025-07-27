import { createServer } from 'nice-grpc';
import { WeatherRouter } from './routers/weather.router.js';
import { grpcErrorMiddleware, Logger, LoggerService } from '@weather-subscription/shared';

type Dependencies = {
  weatherRouter: WeatherRouter;
  loggerService: LoggerService;
};

export class Server {
  private weatherRouter: WeatherRouter;

  private server = createServer();

  private logger: Logger;

  constructor({ weatherRouter, loggerService }: Dependencies) {
    this.weatherRouter = weatherRouter;

    this.logger = loggerService.createLogger('Server');

    this.setup();
  }

  private setup() {
    this.server = this.server.use(grpcErrorMiddleware);

    this.weatherRouter.setup(this.server);
  }

  public async listen(desiredPort: number) {
    const port = await this.server.listen(`0.0.0.0:${desiredPort}`);

    this.logger.info({ msg: 'Server is listening', port });

    return port;
  }

  public async close() {
    await this.server.shutdown();
  }
}
