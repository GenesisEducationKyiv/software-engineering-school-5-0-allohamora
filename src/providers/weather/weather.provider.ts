export type Weather = {
  temperature: number; // in Celsius
  humidity: number; // in percentage
  description: string; // e.g., "Sunny"
};

export abstract class WeatherProvider {
  protected next?: WeatherProvider;

  public abstract getWeather(city: string): Promise<Weather>;
  public abstract validateCity(city: string): Promise<void>;

  public setNext(provider: WeatherProvider): WeatherProvider {
    this.next = provider;

    return this;
  }
}
