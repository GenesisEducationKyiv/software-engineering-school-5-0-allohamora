import { Exception, ExceptionCode } from 'src/exception.js';

vitest.mock('src/services/weather.service.js', () => ({
  getWeather: async (city: string) => {
    if (city !== 'London') {
      throw new Exception(ExceptionCode.NOT_FOUND, 'No matching location found.');
    }

    return {
      temperature: 20,
      humidity: 50,
      description: 'Sunny',
    };
  },
  validateCity: async (city: string) => {
    if (city !== 'London') {
      throw new Exception(ExceptionCode.VALIDATION_ERROR, 'City not found');
    }
  },
}));
