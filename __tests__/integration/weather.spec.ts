import { HttpStatus } from 'src/types/http.types.js';
import { MockInstance } from 'vitest';
import { Exception, ExceptionCode } from 'src/exception.js';
import { Server } from 'src/server.js';
import { WeatherService } from 'src/services/weather.service.js';

describe('weather controller (integration)', () => {
  let server: Server;
  let weatherService: WeatherService;

  let getWeatherSpy: MockInstance;

  beforeAll(() => {
    ({ weatherService, server } = ctx);
  });

  beforeEach(async () => {
    getWeatherSpy = vitest.spyOn(weatherService, 'getWeather');
  });

  afterEach(() => {
    getWeatherSpy.mockRestore();
  });

  const getWeather = async (city: string, status: HttpStatus) => {
    const res = await server.request(`/api/weather?city=${encodeURIComponent(city)}`, {
      method: 'GET',
    });
    expect(res.status).toBe(status);

    return await res.json();
  };

  describe('GET /api/weather', () => {
    it('returns weather for valid city', async () => {
      getWeatherSpy.mockResolvedValueOnce({
        temperature: 25,
        humidity: 60,
        description: 'Partly cloudy',
      });

      const data = await getWeather('London', HttpStatus.OK);

      expect(data).toEqual({
        temperature: 25,
        humidity: 60,
        description: 'Partly cloudy',
      });

      expect(getWeatherSpy).toHaveBeenCalledWith('London');
    });

    it('returns 404 when city not found', async () => {
      getWeatherSpy.mockRejectedValueOnce(new Exception(ExceptionCode.NOT_FOUND, 'No matching location found.'));

      const data = await getWeather('InvalidCity', HttpStatus.NOT_FOUND);

      expect(data).toEqual({
        message: 'No matching location found.',
      });

      expect(getWeatherSpy).toHaveBeenCalledWith('InvalidCity');
    });

    it('returns 400 for invalid request', async () => {
      const res = await server.request('/api/weather', {
        method: 'GET',
      });

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);
      expect(getWeatherSpy).not.toHaveBeenCalled();
    });
  });
});
