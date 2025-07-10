import { createServer } from 'nice-grpc';
import { WeatherService } from './services/weather.service.js';
import { makeWeatherRoutes } from './controllers/weather.controller.js';
import { LoggerService, grpcErrorMiddleware } from '@weather-subscription/shared';
import { MetricsService } from './services/metrics.service.js';

type Options = {
  weatherService: WeatherService;
  metricsService: MetricsService;
  loggerService: LoggerService;
};

export class Server {
  private weatherService: WeatherService;
  private metricsService: MetricsService;

  private server = createServer();

  constructor({ weatherService, metricsService }: Options) {
    this.weatherService = weatherService;
    this.metricsService = metricsService;

    this.setup();
  }

  private setup() {
    this.server = this.server.use(grpcErrorMiddleware);

    makeWeatherRoutes(this.server, this.weatherService, this.metricsService);
  }

  public async listen(port: number) {
    return await this.server.listen(`0.0.0.0:${port}`);
  }

  public async close() {
    await this.server.shutdown();
  }
}
