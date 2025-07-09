import { Exception } from 'src/exception.js';
import { WeatherProvider } from './weather.provider.js';
import { HttpProvider } from '../http/http.provider.js';

const GEOCODING_API_URL = 'https://geocoding-api.open-meteo.com/v1';
const FORECAST_API_URL = 'https://api.open-meteo.com/v1';

type CityResponseResult = {
  id: number; // 2643743,
  name: string; // "London",
  latitude: number; // 51.50853,
  longitude: number; // -0.12574,
  elevation: number; // 25,
  feature_code: string; // "PPLC",
  country_code: string; // "GB",
  admin1_id: number; // 6269131,
  admin2_id: number; // 2648110,
  timezone: string; // "Europe/London",
  population: number; // 8961989,
  country_id: number; // 2635167,
  country: string; // "United Kingdom",
  admin1: string; // "England",
  admin2: string; // "Greater London"
};

type CityResponse = {
  results?: CityResponseResult[];
  generationtime_ms: number; // 0.6712675
};

type WeatherResponse = {
  latitude: number; // 51.5,
  longitude: number; // -0.120000124,
  generationtime_ms: number; // 0.04863739013671875,
  utc_offset_seconds: number; // 0,
  timezone: string; // "GMT",
  timezone_abbreviation: string; // "GMT",
  elevation: number; // 23,
  current_units: {
    time: string; // "iso8601",
    interval: string; // "seconds",
    temperature_2m: string; // "°C",
    relative_humidity_2m: string; // "%",
    weather_code: string; // "wmo code"
  };
  current: {
    time: string; // "2025-06-18T06:00",
    interval: number; // 900,
    temperature_2m: number; // 17,
    relative_humidity_2m: number; // 78,
    weather_code: number; // 2
  };
};

const weatherCodeToDescription: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

type Options = {
  httpProvider: HttpProvider;
};

export class OpenMeteoProvider implements WeatherProvider {
  private httpProvider: HttpProvider;

  constructor({ httpProvider }: Options) {
    this.httpProvider = httpProvider;
  }

  private async getCity(city: string) {
    const res = await this.httpProvider.get({
      url: `${GEOCODING_API_URL}/search`,
      params: {
        name: city,
        count: '1',
        language: 'en',
        format: 'json',
      },
    });

    const data = (await res.json()) as CityResponse;

    if (!data?.results || !data.results[0]) {
      return { success: false, result: null } as const;
    }

    return { success: true, result: data.results[0] } as const;
  }

  private getWeatherDescription(weatherCode: number): string {
    return weatherCodeToDescription[weatherCode] ?? 'Unknown weather condition';
  }

  public async getWeather(city: string) {
    const { success, result } = await this.getCity(city);
    if (!success) {
      throw Exception.NotFound('No matching location found');
    }

    const { latitude, longitude } = result;

    const res = await this.httpProvider.get({
      url: `${FORECAST_API_URL}/forecast`,
      params: {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        current: 'temperature_2m,relative_humidity_2m,weather_code',
      },
    });

    const data = (await res.json()) as WeatherResponse;

    return {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      description: this.getWeatherDescription(data.current.weather_code),
    };
  }

  public async validateCity(city: string) {
    const { success } = await this.getCity(city);

    return success;
  }
}
