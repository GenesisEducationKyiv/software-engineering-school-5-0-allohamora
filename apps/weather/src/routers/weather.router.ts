import { Server } from 'nice-grpc';
import { WeatherService } from 'src/services/weather.service.js';
import { MetricsService } from 'src/services/metrics.service.js';
import { WeatherServiceDefinition } from '@weather-subscription/proto/weather';

export type Dependencies = {
  weatherService: WeatherService;
  metricsService: MetricsService;
};

export class WeatherRouter {
  private weatherService: WeatherService;
  private metricsService: MetricsService;

  constructor({ weatherService, metricsService }: Dependencies) {
    this.weatherService = weatherService;
    this.metricsService = metricsService;
  }

  public setup(server: Server) {
    server.add(WeatherServiceDefinition, {
      getWeather: async ({ city }) => {
        return { weather: await this.weatherService.getWeather(city) };
      },
      validateCity: async ({ city }) => {
        return { isValid: await this.weatherService.validateCity(city) };
      },
      collectMetrics: async () => {
        return await this.metricsService.collectMetrics();
      },
    });
  }
}
