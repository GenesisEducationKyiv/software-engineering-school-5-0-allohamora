import { Weather, WeatherProvider } from 'src/providers/weather/weather.provider.js';

export interface WeatherService {
  getWeather: (city: string) => Promise<Weather>;
  validateCity: (city: string) => Promise<void>;
}

export class ProviderWeatherService implements WeatherService {
  constructor(private provider: WeatherProvider) {}

  public async getWeather(city: string): Promise<Weather> {
    return await this.provider.getWeather(city);
  }

  public async validateCity(city: string): Promise<void> {
    return await this.provider.validateCity(city);
  }
}
