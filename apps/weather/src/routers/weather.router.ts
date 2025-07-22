import { Server } from 'nice-grpc';
import { WeatherService } from 'src/services/weather.service.js';
import { WeatherServiceDefinition } from '@weather-subscription/proto/weather';

export type Dependencies = {
  weatherService: WeatherService;
};

export class WeatherRouter {
  private weatherService: WeatherService;

  constructor({ weatherService }: Dependencies) {
    this.weatherService = weatherService;
  }

  public setup(server: Server) {
    server.add(WeatherServiceDefinition, {
      getWeather: async ({ city }) => {
        return { weather: await this.weatherService.getWeather(city) };
      },
      validateCity: async ({ city }) => {
        return { isValid: await this.weatherService.validateCity(city) };
      },
    });
  }
}
