import { Weather } from 'src/domain/entities/weather.entity.js';

export interface WeatherService {
  getWeather(city: string): Promise<Weather>;
  validateCity(city: string): Promise<void>;
}
