import { Exception, ExceptionCode } from 'src/exception.js';

vitest.mock('src/providers/weather/api-weather.provider.js', async (importOriginal) => {
  const { ApiWeatherProvider } = await importOriginal<typeof import('src/providers/weather/api-weather.provider.js')>();

  class MockApiWeatherProvider extends ApiWeatherProvider {
    public override async getWeather(city: string) {
      if (city !== 'London') {
        throw new Exception(ExceptionCode.NOT_FOUND, 'No matching location found.');
      }

      return {
        temperature: 20,
        humidity: 50,
        description: 'Sunny',
      };
    }

    public override async validateCity(city: string) {
      if (city !== 'London') {
        throw new Exception(ExceptionCode.VALIDATION_ERROR, 'City not found');
      }
    }
  }

  return { ApiWeatherProvider: MockApiWeatherProvider };
});
