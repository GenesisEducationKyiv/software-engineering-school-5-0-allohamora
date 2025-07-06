import { Weather } from 'src/domain/entities/weather.entity.js';

export interface WeatherProvider {
  getWeather(city: string): Promise<Weather>;
  validateCity(city: string): Promise<void>;
}
