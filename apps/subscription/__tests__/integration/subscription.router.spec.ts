import { ctx } from '__tests__/setup-integration-context.js';
import { MockInstance, beforeAll, beforeEach, afterEach, afterAll, describe, it, expect, vitest } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createSigner } from 'fast-jwt';
import { SubscriptionRepository } from 'src/repositories/subscription.repository.js';
import { JwtService } from 'src/services/jwt.service.js';
import { DbService } from 'src/services/db.service.js';
import { Frequency, WeatherClient } from '@weather-subscription/shared';
import { Publisher } from '@weather-subscription/queue';
import { createChannel, createClient } from 'nice-grpc';
import { Frequency as GrpcFrequency, SubscriptionServiceDefinition } from '@weather-subscription/proto/subscription';
import { Server } from 'src/server.js';

describe('subscription router (integration)', () => {
  let weatherClient: WeatherClient;
  let subscriptionRepository: SubscriptionRepository;
  let jwtService: JwtService;
  let publisher: Publisher;
  let server: Server;
  let dbService: DbService;
  let subscriptionClient: ReturnType<typeof createClient<typeof SubscriptionServiceDefinition>>;

  let validateCitySpy: MockInstance;
  let publishSpy: MockInstance;

  beforeAll(async () => {
    ({ weatherClient, subscriptionRepository, jwtService, publisher, server, dbService } = ctx);

    const port = await server.listen(0);

    subscriptionClient = createClient(SubscriptionServiceDefinition, createChannel(`localhost:${port}`));
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(async () => {
    validateCitySpy = vitest.spyOn(weatherClient, 'validateCity').mockImplementation(async () => ({ isValid: true }));
    publishSpy = vitest.spyOn(publisher, 'publish').mockImplementation(vitest.fn());
  });

  afterEach(() => {
    validateCitySpy.mockRestore();
    publishSpy.mockRestore();
  });

  describe('Subscribe', () => {
    it('subscribes with success to the city with daily frequency', async () => {
      const { message } = await subscriptionClient.subscribe({
        city: 'London',
        email: 'test@example.com',
        frequency: GrpcFrequency.Daily,
      });

      expect(message).toBe('Subscription successful. Confirmation email sent.');

      expect(validateCitySpy).toHaveBeenCalledWith({ city: 'London' });
      expect(publishSpy).toHaveBeenCalledWith(
        'send-subscribe-email',
        expect.objectContaining({
          to: ['test@example.com'],
          city: 'London',
        }),
      );
    });

    it('subscribes with success to the city with hourly frequency', async () => {
      const { message } = await subscriptionClient.subscribe({
        city: 'Paris',
        email: 'test@example.com',
        frequency: GrpcFrequency.Hourly,
      });

      expect(message).toBe('Subscription successful. Confirmation email sent.');

      expect(validateCitySpy).toHaveBeenCalledWith({ city: 'Paris' });
      expect(publishSpy).toHaveBeenCalledWith(
        'send-subscribe-email',
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
        subscriptionClient.subscribe({
          city: 'London',
          email: 'test@example.com',
          frequency: GrpcFrequency.Daily,
        }),
      ).rejects.toThrow();

      expect(validateCitySpy).not.toHaveBeenCalled();
      expect(publishSpy).not.toHaveBeenCalled();
    });

    it('throws error for invalid city', async () => {
      validateCitySpy.mockImplementationOnce(async () => ({ isValid: false }));

      await expect(
        subscriptionClient.subscribe({
          city: 'InvalidCity',
          email: 'test@example.com',
          frequency: GrpcFrequency.Daily,
        }),
      ).rejects.toThrow();

      expect(validateCitySpy).toHaveBeenCalledWith({ city: 'InvalidCity' });
      expect(publishSpy).not.toHaveBeenCalled();
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
      const { message } = await subscriptionClient.confirm({ token });
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

      await expect(subscriptionClient.confirm({ token: jwt })).rejects.toThrow();

      const db = dbService.getConnection();
      const subscriptionInDb = await db.query.subscriptions.findMany();
      expect(subscriptionInDb).toHaveLength(0);
    });

    it('throws error for invalid token', async () => {
      await expect(subscriptionClient.confirm({ token: 'invalid-token' })).rejects.toThrow();

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

      await expect(subscriptionClient.confirm({ token })).rejects.toThrow();

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

      const { message } = await subscriptionClient.unsubscribe({ token: subscription.id });

      expect(message).toBe('Unsubscribed successfully');

      const db = dbService.getConnection();
      const subscriptionInDb = await db.query.subscriptions.findMany({
        where: (subscriptions, { eq }) => eq(subscriptions.id, subscription.id),
      });
      expect(subscriptionInDb).toHaveLength(0);
    });

    it('handles non-existent subscription gracefully', async () => {
      const nonExistentId = randomUUID();
      const { message } = await subscriptionClient.unsubscribe({ token: nonExistentId });

      expect(message).toBe('Unsubscribed successfully');

      const db = dbService.getConnection();
      const subscriptionInDb = await db.query.subscriptions.findMany();
      expect(subscriptionInDb).toHaveLength(0);
    });

    it('throws error for wrong token format', async () => {
      await expect(subscriptionClient.unsubscribe({ token: 'test' })).rejects.toThrow();
    });
  });
});
