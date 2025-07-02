import { Exception } from 'src/domain/exception.js';

vitest.mock('src/domain/services/weather.service.js', async (importOriginal) => {
  const { WeatherService } = await importOriginal<typeof import('src/domain/services/weather.service.js')>();

  class MockWeatherService extends WeatherService {
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
      if (city !== 'London') {
        throw Exception.ValidationError('City not found');
      }
    }
  }

  return { WeatherService: MockWeatherService };
});
