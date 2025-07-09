import { Server } from 'nice-grpc';
import { WeatherService } from 'src/services/weather.service.js';
import { WeatherServiceDefinition } from 'libs/proto/dist/weather.js';
import { MetricsService } from 'src/services/metrics.service.js';

export const makeWeatherRoutes = (server: Server, weatherService: WeatherService, metricsService: MetricsService) => {
  server.add(WeatherServiceDefinition, {
    getWeather: async ({ city }) => {
      return { weather: await weatherService.getWeather(city) };
    },
    validateCity: async ({ city }) => {
      return { isValid: await weatherService.validateCity(city) };
    },
    collectMetrics: async () => {
      return await metricsService.collectMetrics();
    },
  });
};
