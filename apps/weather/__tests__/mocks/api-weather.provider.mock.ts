import { Exception } from '@weather-subscription/shared';
import { vitest } from 'vitest';

vitest.mock('src/providers/weather/api-weather.provider.js', async (importOriginal) => {
  const { ApiWeatherProvider } = await importOriginal<typeof import('src/providers/weather/api-weather.provider.js')>();

  class MockApiWeatherProvider extends ApiWeatherProvider {
    public override async getWeather(city: string) {
      if (city !== 'London') {
        throw Exception.NotFound('No matching location found.');
      }

      return {
        temperature: 20,
        humidity: 50,
        description: 'Sunny',
      };
    }

    public override async validateCity(city: string) {
      return city === 'London';
    }
  }

  return { ApiWeatherProvider: MockApiWeatherProvider };
});
