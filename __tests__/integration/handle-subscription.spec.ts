import { Frequency } from 'src/db.schema.js';
import { HandleSubscriptionService } from 'src/services/handle-subscription.service.js';
import { WeatherService } from 'src/services/weather.service.js';
import { SubscriptionRepository } from 'src/repositories/subscription.repository.js';
import { MockInstance } from 'vitest';
import { SendEmailService } from 'src/services/send-email.service.js';

describe('WeatherHandleSubscriptionService (integration)', () => {
  let handleSubscriptionService: HandleSubscriptionService;
  let sendEmailService: SendEmailService;
  let weatherService: WeatherService;
  let subscriptionRepository: SubscriptionRepository;

  let sendEmailSpy: MockInstance;
  let getWeatherSpy: MockInstance;

  beforeAll(() => {
    ({ handleSubscriptionService, sendEmailService, weatherService, subscriptionRepository } = ctx);
  });

  beforeEach(async () => {
    sendEmailSpy = vitest.spyOn(sendEmailService, 'sendEmail').mockImplementation(vitest.fn());
    getWeatherSpy = vitest.spyOn(weatherService, 'getWeather').mockImplementation(async (city) => ({
      temperature: 20,
      humidity: 50,
      description: city === 'London' ? 'Sunny' : 'Cloudy',
    }));
  });

  afterEach(() => {
    sendEmailSpy.mockRestore();
    getWeatherSpy.mockRestore();
  });

  describe.each([Frequency.Daily, Frequency.Hourly])('handles %s', (frequency) => {
    it(`processes subscriptions and sends weather updates`, async () => {
      const cities = ['London', 'Paris'];
      const testSubscriptions = cities.map((city, idx) => ({
        email: `${idx}@example.com`,
        city,
        frequency,
      }));

      for (const subscription of testSubscriptions) {
        await subscriptionRepository.createSubscription(subscription);
      }

      await handleSubscriptionService.handleWeatherSubscription(frequency)();

      expect(getWeatherSpy).toHaveBeenCalledWith(cities[0]);
      expect(getWeatherSpy).toHaveBeenCalledWith(cities[1]);

      expect(sendEmailSpy).toHaveBeenCalledTimes(2);

      expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [`0@example.com`],
        }),
      );

      expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [`1@example.com`],
        }),
      );
    });

    it(`handles empty subscription list correctly`, async () => {
      await handleSubscriptionService.handleWeatherSubscription(frequency)();

      expect(getWeatherSpy).not.toHaveBeenCalled();
      expect(sendEmailSpy).not.toHaveBeenCalled();
    });

    it('processes subscriptions in batches', async () => {
      const cities = ['London', 'Paris', 'Berlin', 'Tokyo', 'New York'];
      const testSubscriptions = Array.from({ length: 55 }, (_, idx) => {
        const cityIndex = idx % cities.length;

        return {
          email: `${idx}@example.com`,
          city: cities[cityIndex]!,
          frequency,
        };
      });

      for (const subscription of testSubscriptions) {
        await subscriptionRepository.createSubscription(subscription);
      }

      await handleSubscriptionService.handleWeatherSubscription(frequency)();

      expect(getWeatherSpy).toHaveBeenCalledTimes(55);
      expect(sendEmailSpy).toHaveBeenCalledTimes(55);

      const subscription10 = testSubscriptions[10] as (typeof testSubscriptions)[number];
      expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [subscription10.email],
        }),
      );

      const subscription50 = testSubscriptions[50] as (typeof testSubscriptions)[number];
      expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [subscription50.email],
        }),
      );
    });
  });
});
