import { Exception } from 'src/domain/entities/exception.entity.js';

vitest.mock('src/domain/services/weather.service.js', async (importOriginal) => {
  const { ChainWeatherService } = await importOriginal<typeof import('src/domain/services/chain.weather.service.js')>();

  class MockChainWeatherService extends ChainWeatherService {
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

  return { ChainWeatherService: MockChainWeatherService };
});
