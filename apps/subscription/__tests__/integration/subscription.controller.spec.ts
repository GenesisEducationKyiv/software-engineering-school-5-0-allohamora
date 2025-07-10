import { ctx } from '__tests__/setup-integration-context.js';
import { MockInstance, beforeAll, beforeEach, afterEach, afterAll, describe, it, expect, vitest } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createSigner } from 'fast-jwt';
import { SubscriptionRepository } from 'src/repositories/subscription.repository.js';
import { JwtService } from 'src/services/jwt.service.js';
import { DbService } from 'src/services/db.service.js';
import { Frequency, EmailClient, WeatherClient, toGrpcFrequency } from '@weather-subscription/shared';
import { createChannel, createClient } from 'nice-grpc';
import { SubscriptionServiceDefinition } from '@weather-subscription/proto/subscription';
import type { SubscribeOptions } from 'src/services/subscription.service.js';
import { Server } from 'src/server.js';

describe('subscription controller (integration)', () => {
  let weatherClient: WeatherClient;
  let subscriptionRepository: SubscriptionRepository;
  let jwtService: JwtService;
  let emailClient: EmailClient;
  let server: Server;
  let dbService: DbService;
  let subscriptionClient: ReturnType<typeof createClient<typeof SubscriptionServiceDefinition>>;

  let validateCitySpy: MockInstance;
  let sendEmailSpy: MockInstance;

  beforeAll(async () => {
    ({ weatherClient, subscriptionRepository, jwtService, emailClient, server, dbService } = ctx);

    const port = await server.listen(0);

    subscriptionClient = createClient(SubscriptionServiceDefinition, createChannel(`localhost:${port}`));
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(async () => {
    validateCitySpy = vitest.spyOn(weatherClient, 'validateCity').mockImplementation(async () => ({ isValid: true }));
    sendEmailSpy = vitest.spyOn(emailClient, 'sendSubscribeEmail').mockImplementation(vitest.fn());
  });

  afterEach(() => {
    validateCitySpy.mockRestore();
    sendEmailSpy.mockRestore();
  });

  const subscribe = async (options: SubscribeOptions) => {
    return await subscriptionClient.subscribe({
      ...options,
      frequency: toGrpcFrequency(options.frequency),
    });
  };

  const confirm = async (token: string) => {
    return await subscriptionClient.confirm({ token });
  };

  const unsubscribe = async (token: string) => {
    return await subscriptionClient.unsubscribe({ token });
  };

  describe('Subscribe', () => {
    it('subscribes with success to the city with daily frequency', async () => {
      const { message } = await subscribe({
        city: 'London',
        email: 'test@example.com',
        frequency: Frequency.Daily,
      });

      expect(message).toBe('Subscription successful. Confirmation email sent.');

      expect(validateCitySpy).toHaveBeenCalledWith({ city: 'London' });
      expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['test@example.com'],
          city: 'London',
        }),
      );
    });

    it('subscribes with success to the city with hourly frequency', async () => {
      const { message } = await subscribe({
        city: 'Paris',
        email: 'test@example.com',
        frequency: Frequency.Hourly,
      });

      expect(message).toBe('Subscription successful. Confirmation email sent.');

      expect(validateCitySpy).toHaveBeenCalledWith({ city: 'Paris' });
      expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['test@example.com'],
          city: 'Paris',
        }),
      );
    });

    it('throws error when subscription already exists', async () => {
      await subscriptionRepository.createSubscription({
        email: 'test@example.com',
        city: 'London',
        frequency: Frequency.Daily,
      });

      await expect(
        subscribe({
          city: 'London',
          email: 'test@example.com',
          frequency: Frequency.Daily,
        }),
      ).rejects.toThrow();

      expect(validateCitySpy).not.toHaveBeenCalled();
      expect(sendEmailSpy).not.toHaveBeenCalled();
    });

    it('throws error for invalid city', async () => {
      validateCitySpy.mockImplementationOnce(async () => ({ isValid: false }));

      await expect(
        subscribe({
          city: 'InvalidCity',
          email: 'test@example.com',
          frequency: Frequency.Daily,
        }),
      ).rejects.toThrow();

      expect(validateCitySpy).toHaveBeenCalledWith({ city: 'InvalidCity' });
      expect(sendEmailSpy).not.toHaveBeenCalled();
    });
  });

  describe('Confirm', () => {
    it('confirms subscription successfully', async () => {
      const subscribeData = {
        email: 'test@example.com',
        city: 'London',
        frequency: Frequency.Daily,
      };

      const token = await jwtService.sign(subscribeData);
      const { message } = await confirm(token);
      expect(message).toBe('Subscription confirmed successfully');

      const db = dbService.getConnection();
      const subscriptionInDb = await db.query.subscriptions.findMany({
        where: (subscriptions, { eq }) => eq(subscriptions.email, 'test@example.com'),
      });
      expect(subscriptionInDb).toHaveLength(1);
      expect(subscriptionInDb[0]?.city).toBe('London');
      expect(subscriptionInDb[0]?.frequency).toBe(Frequency.Daily);
    });

    it('throws error for invalid jwt token', async () => {
      const signer = createSigner({
        key: async () => 'test',
        expiresIn: 1800000, // in ms
      });

      const jwt = await signer({ test: true });

      await expect(confirm(jwt)).rejects.toThrow();

      const db = dbService.getConnection();
      const subscriptionInDb = await db.query.subscriptions.findMany();
      expect(subscriptionInDb).toHaveLength(0);
    });

    it('throws error for invalid token', async () => {
      await expect(confirm('invalid-token')).rejects.toThrow();

      const db = dbService.getConnection();
      const subscriptionInDb = await db.query.subscriptions.findMany();
      expect(subscriptionInDb).toHaveLength(0);
    });

    it('throws error when subscription already exists', async () => {
      await subscriptionRepository.createSubscription({
        email: 'test@example.com',
        city: 'London',
        frequency: Frequency.Daily,
      });

      const token = await jwtService.sign({
        email: 'test@example.com',
        city: 'Berlin',
        frequency: Frequency.Hourly,
      });

      await expect(confirm(token)).rejects.toThrow();

      const db = dbService.getConnection();
      const subscriptionInDb = await db.query.subscriptions.findMany({
        where: (subscriptions, { eq }) => eq(subscriptions.email, 'test@example.com'),
      });
      expect(subscriptionInDb).toHaveLength(1);
      expect(subscriptionInDb[0]?.city).toBe('London');
      expect(subscriptionInDb[0]?.frequency).toBe(Frequency.Daily);
    });
  });

  describe('Unsubscribe', () => {
    it('unsubscribes successfully', async () => {
      const subscription = await subscriptionRepository.createSubscription({
        email: 'test@example.com',
        city: 'London',
        frequency: Frequency.Daily,
      });

      const { message } = await unsubscribe(subscription.id);

      expect(message).toBe('Unsubscribed successfully');

      const db = dbService.getConnection();
      const subscriptionInDb = await db.query.subscriptions.findMany({
        where: (subscriptions, { eq }) => eq(subscriptions.id, subscription.id),
      });
      expect(subscriptionInDb).toHaveLength(0);
    });

    it('handles non-existent subscription gracefully', async () => {
      const nonExistentId = randomUUID();
      const { message } = await unsubscribe(nonExistentId);

      expect(message).toBe('Unsubscribed successfully');

      const db = dbService.getConnection();
      const subscriptionInDb = await db.query.subscriptions.findMany();
      expect(subscriptionInDb).toHaveLength(0);
    });

    it('throws error for wrong token format', async () => {
      await expect(unsubscribe('test')).rejects.toThrow();
    });
  });
});
