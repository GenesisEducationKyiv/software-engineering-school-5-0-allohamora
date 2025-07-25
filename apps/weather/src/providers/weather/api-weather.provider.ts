import { Exception } from '@weather-subscription/shared';
import { WeatherProvider } from './weather.provider.js';
import { HttpProvider } from '../http/http.provider.js';

const API_URL = 'https://api.weatherapi.com/v1';

type WeatherResponse = {
  location: {
    name: string; // "London",
    region: string; // "City of London, Greater London",
    country: string; // "United Kingdom",
    lat: number; // 51.5171,
    lon: number; // -0.1062,
    tz_id: string; // "Europe/London",
    localtime_epoch: number; // 1747148529,
    localtime: string; // "2025-05-13 16:02"
  };
  current: {
    last_updated_epoch: number; // 1747148400,
    last_updated: string; // "2025-05-13 16:00",
    temp_c: number; // 20.2,
    temp_f: number; // 68.4,
    is_day: number; // 1,
    condition: {
      text: string; // "Sunny",
      icon: string; // "//cdn.weatherapi.com/weather/64x64/day/113.png",
      code: number; // 1000
    };
    wind_mph: number; // 11.4,
    wind_kph: number; // 18.4,
    wind_degree: number; // 81,
    wind_dir: string; // "E",
    pressure_mb: number; // 1018.0,
    pressure_in: number; // 30.06,
    precip_mm: number; // 0.0,
    precip_in: number; // 0.0,
    humidity: number; // 49,
    cloud: number; // 0,
    feelslike_c: number; // 20.2,
    feelslike_f: number; // 68.4,
    windchill_c: number; // 20.5,
    windchill_f: number; // 68.9,
    heatindex_c: number; // 20.5,
    heatindex_f: number; // 68.9,
    dewpoint_c: number; // 7.7,
    dewpoint_f: number; // 45.9,
    vis_km: number; // 10.0,
    vis_miles: number; // 6.0,
    uv: number; // 3.2,
    gust_mph: number; // 13.1,
    gust_kph: number; // 21.1
  };
};

const enum ErrorCode {
  NO_MATCHING_LOCATION_FOUND = 1006,
}

type WeatherErrorResponse = {
  error: {
    code: ErrorCode; // 1006,
    message: string; // 'No matching location found.'
  };
};

type Dependencies = {
  httpProvider: HttpProvider;
  config: { WEATHER_API_KEY: string };
};

export class ApiWeatherProvider implements WeatherProvider {
  private httpProvider: HttpProvider;
  private weatherApiKey: string;

  constructor({ httpProvider, config }: Dependencies) {
    this.httpProvider = httpProvider;
    this.weatherApiKey = config.WEATHER_API_KEY;
  }

  private async getCurrentWeather(city: string) {
    const res = await this.httpProvider.get({
      url: `${API_URL}/current.json`,
      params: {
        key: this.weatherApiKey,
        q: city,
      },
      handleIsOk: false,
    });

    const data = await res.json();

    if (res.ok) {
      const { current } = data as WeatherResponse;

      return {
        success: true,
        result: {
          temperature: current.temp_c,
          humidity: current.humidity,
          description: current.condition.text,
        },
      } as const;
    }

    const { error } = data as WeatherErrorResponse;

    if (error.code === ErrorCode.NO_MATCHING_LOCATION_FOUND) {
      return {
        success: false,
        result: null,
      } as const;
    }

    throw Exception.InternalServerError(error?.message);
  }

  public async getWeather(city: string) {
    const { success, result } = await this.getCurrentWeather(city);
    if (!success) {
      throw Exception.NotFound('No matching location found');
    }

    return result;
  }

  public async validateCity(city: string) {
    const { success } = await this.getCurrentWeather(city);

    return success;
  }
}
