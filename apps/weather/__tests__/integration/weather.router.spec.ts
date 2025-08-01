import { ctx } from '__tests__/setup-integration-context.js';
import { MockInstance, beforeAll, beforeEach, afterEach, afterAll, describe, it, expect, vitest } from 'vitest';
import { Server } from 'src/server.js';
import { createChannel, createClient } from 'nice-grpc';
import { WeatherServiceDefinition } from '@weather-subscription/proto/weather';
import { WeatherProvider } from 'src/providers/weather/weather.provider.js';

describe('weather router (integration)', () => {
  let server: Server;
  let weatherClient: ReturnType<typeof createClient<typeof WeatherServiceDefinition>>;
  let weatherProvider: WeatherProvider;

  let getWeatherSpy: MockInstance;
  let validateCitySpy: MockInstance;

  beforeAll(async () => {
    ({ server } = ctx);

    weatherProvider = ctx.weatherProviders[0] as WeatherProvider;

    const port = await server.listen(0);

    weatherClient = createClient(WeatherServiceDefinition, createChannel(`localhost:${port}`));
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(async () => {
    getWeatherSpy = vitest.spyOn(weatherProvider, 'getWeather');
    validateCitySpy = vitest.spyOn(weatherProvider, 'validateCity');
  });

  afterEach(() => {
    getWeatherSpy.mockRestore();
    validateCitySpy.mockRestore();
  });

  const getWeather = async (city: string) => {
    return await weatherClient.getWeather({ city });
  };

  const validateCity = async (city: string) => {
    return await weatherClient.validateCity({ city });
  };

  describe('GetWeather', () => {
    it('returns weather for valid city', async () => {
      getWeatherSpy.mockResolvedValueOnce({
        temperature: 25,
        humidity: 60,
        description: 'Partly cloudy',
      });

      const { weather } = await getWeather('London');

      expect(weather).toEqual({
        temperature: 25,
        humidity: 60,
        description: 'Partly cloudy',
      });

      expect(getWeatherSpy).toHaveBeenCalledWith('London');
    });

    it('throws error when city not found', async () => {
      getWeatherSpy.mockRejectedValueOnce(new Error('No matching location found.'));

      await expect(getWeather('InvalidCity')).rejects.toThrow();

      expect(getWeatherSpy).toHaveBeenCalledWith('InvalidCity');
    });
  });

  describe('ValidateCity', () => {
    it('returns true for valid city', async () => {
      validateCitySpy.mockResolvedValueOnce(true);

      const { isValid } = await validateCity('London');

      expect(isValid).toBe(true);
      expect(validateCitySpy).toHaveBeenCalledWith('London');
    });

    it('returns false for invalid city', async () => {
      validateCitySpy.mockResolvedValueOnce(false);

      const { isValid } = await validateCity('InvalidCity');

      expect(isValid).toBe(false);
      expect(validateCitySpy).toHaveBeenCalledWith('InvalidCity');
    });
  });
});
