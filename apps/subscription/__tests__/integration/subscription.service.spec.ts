import { ctx } from '__tests__/setup-integration-context.js';
import { EmailClient, Frequency, WeatherClient } from '@weather-subscription/shared';
import { SubscriptionRepository } from 'src/repositories/subscription.repository.js';
import { SubscriptionService } from 'src/services/subscription.service.js';
import { afterEach, beforeAll, beforeEach, describe, expect, it, MockInstance, vitest } from 'vitest';

describe('SubscriptionService (integration)', () => {
  let subscriptionService: SubscriptionService;
  let emailClient: EmailClient;
  let weatherClient: WeatherClient;
  let subscriptionRepository: SubscriptionRepository;

  let sendWeatherUpdateEmailSpy: MockInstance;
  let getWeatherSpy: MockInstance;

  beforeAll(() => {
    ({ subscriptionService, emailClient, weatherClient, subscriptionRepository } = ctx);
  });

  beforeEach(async () => {
    sendWeatherUpdateEmailSpy = vitest.spyOn(emailClient, 'sendWeatherUpdateEmail').mockImplementation(vitest.fn());

    getWeatherSpy = vitest.spyOn(weatherClient, 'getWeather').mockImplementation(async ({ city }) => ({
      weather: {
        temperature: 20,
        humidity: 50,
        description: city === 'London' ? 'Sunny' : 'Cloudy',
      },
    }));
  });

  afterEach(() => {
    sendWeatherUpdateEmailSpy.mockRestore();
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

      await subscriptionService.handleSubscriptions(frequency);

      expect(getWeatherSpy).toHaveBeenCalledWith({ city: cities[0] });
      expect(getWeatherSpy).toHaveBeenCalledWith({ city: cities[1] });

      expect(sendWeatherUpdateEmailSpy).toHaveBeenCalledTimes(2);

      expect(sendWeatherUpdateEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [`0@example.com`],
          city: 'London',
          description: 'Sunny',
          temperature: 20,
          humidity: 50,
          unsubscribeLink: expect.stringMatching(/\/api\/unsubscribe\//),
        }),
      );

      expect(sendWeatherUpdateEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [`1@example.com`],
          city: 'Paris',
          description: 'Cloudy',
          temperature: 20,
          humidity: 50,
          unsubscribeLink: expect.stringMatching(/\/api\/unsubscribe\//),
        }),
      );
    });

    it(`handles empty subscription list correctly`, async () => {
      await subscriptionService.handleSubscriptions(frequency);

      expect(getWeatherSpy).not.toHaveBeenCalled();
      expect(sendWeatherUpdateEmailSpy).not.toHaveBeenCalled();
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

      await subscriptionService.handleSubscriptions(frequency);

      expect(getWeatherSpy).toHaveBeenCalledTimes(cities.length);
      expect(sendWeatherUpdateEmailSpy).toHaveBeenCalledTimes(55);

      const subscription10 = testSubscriptions[10] as (typeof testSubscriptions)[number];
      expect(sendWeatherUpdateEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [subscription10.email],
        }),
      );

      const subscription50 = testSubscriptions[50] as (typeof testSubscriptions)[number];
      expect(sendWeatherUpdateEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [subscription50.email],
        }),
      );
    });
  });
});
