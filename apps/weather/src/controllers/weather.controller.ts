import { Server } from 'nice-grpc';
import { WeatherService } from 'src/services/weather.service.js';
import { WeatherServiceDefinition } from '@weather-subscription/proto/weather';

export const makeWeatherRoutes = (server: Server, weatherService: WeatherService) => {
  server.add(WeatherServiceDefinition, {
    getWeather: async ({ city }) => {
      return { weather: await weatherService.getWeather(city) };
    },
    validateCity: async ({ city }) => {
      return { isValid: await weatherService.validateCity(city) };
    },
  });
};
