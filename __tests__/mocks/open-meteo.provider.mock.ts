import { Exception, ExceptionCode } from 'src/exception.js';

vitest.mock('src/providers/weather/open-meteo.provider.js', async (importOriginal) => {
  const { OpenMeteoProvider } = await importOriginal<typeof import('src/providers/weather/open-meteo.provider.js')>();

  class MockOpenMeteoProvider extends OpenMeteoProvider {
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

  return { OpenMeteoProvider: MockOpenMeteoProvider };
});
