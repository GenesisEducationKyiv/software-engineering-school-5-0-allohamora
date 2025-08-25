import { createServer } from 'nice-grpc';
import { WeatherRouter } from './routers/weather.router.js';
import { GrpcService, Logger, LoggerService } from '@weather-subscription/shared';

type Dependencies = {
  weatherRouter: WeatherRouter;
  grpcService: GrpcService;
  loggerService: LoggerService;
};

export class Server {
  private weatherRouter: WeatherRouter;
  private grpcService: GrpcService;

  private server = createServer();

  private logger: Logger;

  constructor({ weatherRouter, grpcService, loggerService }: Dependencies) {
    this.weatherRouter = weatherRouter;
    this.grpcService = grpcService;

    this.logger = loggerService.createLogger('Server');

    this.setup();
  }

  private setup() {
    this.server = this.server.use(this.grpcService.createErrorMiddleware());

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
