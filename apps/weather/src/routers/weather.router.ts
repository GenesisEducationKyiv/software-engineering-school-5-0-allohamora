import { Server } from 'nice-grpc';
import { WeatherService } from 'src/services/weather.service.js';
import { WeatherServiceDefinition } from '@weather-subscription/proto/weather';
import { Logger, LoggerService } from '@weather-subscription/shared';

export type Dependencies = {
  weatherService: WeatherService;
  loggerService: LoggerService;
};

export class WeatherRouter {
  private weatherService: WeatherService;
  private logger: Logger;

  constructor({ weatherService, loggerService }: Dependencies) {
    this.weatherService = weatherService;

    this.logger = loggerService.createLogger('WeatherRouter');
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

    this.logger.debug({ msg: 'WeatherRouter has been set up' });
  }
}
