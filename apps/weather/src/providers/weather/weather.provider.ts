export type Weather = {
  temperature: number; // in Celsius
  humidity: number; // in percentage
  description: string; // e.g., "Sunny"
};

export interface WeatherProvider {
  getWeather(city: string): Promise<Weather>;
  validateCity(city: string): Promise<boolean>;
}
