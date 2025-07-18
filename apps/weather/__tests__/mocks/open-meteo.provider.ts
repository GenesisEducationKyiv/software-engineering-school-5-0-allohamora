import { Exception } from '@weather-subscription/shared';
import { vitest } from 'vitest';

vitest.mock('src/providers/weather/open-meteo.provider.js', async (importOriginal) => {
  const { OpenMeteoProvider } = await importOriginal<typeof import('src/providers/weather/open-meteo.provider.js')>();

  class MockOpenMeteoProvider extends OpenMeteoProvider {
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

  return { OpenMeteoProvider: MockOpenMeteoProvider };
});
