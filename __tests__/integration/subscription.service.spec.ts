import { ctx } from '__tests__/setup-integration-context.js';
import { MockInstance } from 'vitest';
import { WeatherService } from 'src/domain/services/weather.service.js';
import { SubscriptionRepository } from 'src/domain/ports/secondary/subscription.repository.js';
import { EmailProvider } from 'src/domain/ports/secondary/email.provider.js';
import { Frequency } from 'src/domain/entities/subscription.entity.js';
import { SubscriptionService } from 'src/domain/services/subscription.service.js';

describe('SubscriptionService (integration)', () => {
  let subscriptionService: SubscriptionService;
  let emailProvider: EmailProvider;
  let weatherService: WeatherService;
  let subscriptionRepository: SubscriptionRepository;

  let sendEmailSpy: MockInstance;
  let getWeatherSpy: MockInstance;

  beforeAll(() => {
    ({ subscriptionService, emailProvider, weatherService, subscriptionRepository } = ctx);
  });

  beforeEach(async () => {
    sendEmailSpy = vitest.spyOn(emailProvider, 'sendEmail').mockImplementation(vitest.fn());
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

      await Promise.all(
        testSubscriptions.map((subscription) => subscriptionRepository.createSubscription(subscription)),
      );

      await subscriptionService.createWeatherSubscriptionHandler(frequency)();

      expect(getWeatherSpy).toHaveBeenCalledWith(cities[0]);
      expect(getWeatherSpy).toHaveBeenCalledWith(cities[1]);

      expect(sendEmailSpy).toHaveBeenCalledTimes(2);

      expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [`0@example.com`],
          template: {
            title: 'Weather update for London',
            html: expect.stringMatching('London'),
            text: expect.stringMatching('London'),
          },
        }),
      );

      expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [`1@example.com`],
          template: {
            title: 'Weather update for Paris',
            html: expect.stringMatching('Paris'),
            text: expect.stringMatching('Paris'),
          },
        }),
      );
    });

    it(`handles empty subscription list correctly`, async () => {
      await subscriptionService.createWeatherSubscriptionHandler(frequency)();

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

      await Promise.all(
        testSubscriptions.map((subscription) => subscriptionRepository.createSubscription(subscription)),
      );

      await subscriptionService.createWeatherSubscriptionHandler(frequency)();

      expect(getWeatherSpy).toHaveBeenCalledTimes(cities.length);
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
