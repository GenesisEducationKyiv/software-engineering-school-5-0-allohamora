import { createServer, Status, ServerError } from 'nice-grpc';
import { WeatherService } from './services/weather.service.js';
import { Exception } from './exception.js';
import { makeWeatherRoutes } from './controllers/weather.controller.js';
import { LoggerService } from './services/logger.service.js';

type Options = {
  weatherService: WeatherService;
  loggerService: LoggerService;
};

export class Server {
  private weatherService: WeatherService;

  private server = createServer();

  constructor({ weatherService }: Options) {
    this.weatherService = weatherService;

    this.setup();
  }

  private setup() {
    this.server.use(async function* (call, context) {
      try {
        yield* call.next(call.request, context);
      } catch (err) {
        if (err instanceof Exception) {
          const message = err instanceof Exception ? err.message : 'internal server error';
          const statusCode = err instanceof Exception ? err.toGrpcCode(err.code) : Status.INTERNAL;

          throw new ServerError(statusCode, message);
        }

        throw new ServerError(Status.UNKNOWN, 'internal server error');
      }
    });

    makeWeatherRoutes(this.server, this.weatherService);
  }

  public async listen(port: number) {
    await this.server.listen(`localhost:${port}`);
  }

  public async close() {
    await this.server.shutdown();
  }
}
