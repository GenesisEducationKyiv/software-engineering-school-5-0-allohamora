import { Exception, ExceptionCode } from 'src/exception.js';

vitest.mock('src/services/weather.service.js', async (importOriginal) => {
  const { ChainWeatherService } = await importOriginal<typeof import('src/services/weather.service.js')>();

  class MockChainWeatherService extends ChainWeatherService {
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

  return { ChainWeatherService: MockChainWeatherService };
});
