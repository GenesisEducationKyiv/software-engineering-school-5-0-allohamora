import { ctx } from '__tests__/setup-integration-context.js';
import { SubscribeOptions } from 'src/domain/services/jwt.subscription.service.js';
import { HttpStatus } from 'src/primary/types/http.types.js';
import { MockInstance } from 'vitest';
import { Exception } from 'src/domain/entities/exception.entity.js';
import { randomUUID } from 'node:crypto';
import { createSigner } from 'fast-jwt';
import { Server } from 'src/primary/adapters/server.js';
import { SubscriptionRepository } from 'src/domain/ports/secondary/subscription.repository.js';
import { JwtProvider } from 'src/domain/ports/secondary/jwt.provider.js';
import { EmailProvider } from 'src/domain/ports/secondary/email.provider.js';
import { Db } from 'src/secondary/adapters/db.provider.js';
import { Frequency } from 'src/domain/entities/subscription.entity.js';
import { WeatherService } from 'src/domain/ports/primary/weather.service.js';

describe('subscription controller (integration)', () => {
  let weatherService: WeatherService;
  let subscriptionRepository: SubscriptionRepository;
  let jwtProvider: JwtProvider;
  let emailProvider: EmailProvider;
  let server: Server;
  let db: Db;

  let validateCitySpy: MockInstance;
  let sendEmailSpy: MockInstance;

  beforeAll(() => {
    ({ weatherService, subscriptionRepository, jwtProvider, emailProvider, server, db } = ctx);
  });

  beforeEach(async () => {
    validateCitySpy = vitest.spyOn(weatherService, 'validateCity').mockImplementation(vitest.fn());
    sendEmailSpy = vitest.spyOn(emailProvider, 'sendEmail').mockImplementation(vitest.fn());
  });

  afterEach(() => {
    validateCitySpy.mockRestore();
    sendEmailSpy.mockRestore();
  });

  const subscribe = async (options: SubscribeOptions, status: HttpStatus) => {
    const res = await server.request('/api/subscribe', {
      method: 'POST',
      body: JSON.stringify(options),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(res.status).toBe(status);

    const body = await res.json();
    return body as { message: string };
  };

  const subscribeForm = async ({ city, email, frequency }: SubscribeOptions, status: HttpStatus) => {
    const formData = new URLSearchParams();
    formData.append('city', city);
    formData.append('email', email);
    formData.append('frequency', frequency);

    const res = await server.request('/api/subscribe', {
      method: 'POST',
      body: formData.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    expect(res.status).toBe(status);

    const body = await res.json();
    return body as { message: string };
  };

  const confirm = async (token: string, status: HttpStatus) => {
    const res = await server.request(`/api/confirm/${token}`, {
      method: 'GET',
    });
    expect(res.status).toBe(status);

    const body = await res.json();
    return body as { message: string };
  };

  const unsubscribe = async (token: string, status: HttpStatus) => {
    const res = await server.request(`/api/unsubscribe/${token}`, {
      method: 'GET',
    });
    expect(res.status).toBe(status);

    const body = await res.json();
    return body as { message: string };
  };

  describe('POST /api/subscribe json', () => {
    it('subscribes with 200 to the city with daily frequency', async () => {
      const { message } = await subscribe(
        {
          city: 'London',
          email: 'test@example.com',
          frequency: Frequency.Daily,
        },
        HttpStatus.OK,
      );

      expect(message).toBe('Subscription successful. Confirmation email sent.');

      expect(validateCitySpy).toHaveBeenCalledWith('London');
      expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['test@example.com'],
          template: expect.objectContaining({
            title: 'Confirm your weather subscription for London',
          }),
        }),
      );
    });

    it('subscribes with 200 to the city with hourly frequency', async () => {
      const { message } = await subscribe(
        {
          city: 'Paris',
          email: 'test@example.com',
          frequency: Frequency.Hourly,
        },
        HttpStatus.OK,
      );

      expect(message).toBe('Subscription successful. Confirmation email sent.');

      expect(validateCitySpy).toHaveBeenCalledWith('Paris');
      expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['test@example.com'],
          template: expect.objectContaining({
            title: 'Confirm your weather subscription for Paris',
          }),
        }),
      );
    });

    it('returns 409 when subscription already exists', async () => {
      await subscriptionRepository.createSubscription({
        email: 'test@example.com',
        city: 'London',
        frequency: Frequency.Daily,
      });

      await subscribe(
        {
          city: 'London',
          email: 'test@example.com',
          frequency: Frequency.Daily,
        },
        HttpStatus.CONFLICT,
      );

      expect(validateCitySpy).not.toHaveBeenCalled();
      expect(sendEmailSpy).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid city', async () => {
      validateCitySpy.mockImplementationOnce(async () => {
        throw Exception.ValidationError('Invalid city');
      });

      await subscribe(
        {
          city: 'InvalidCity',
          email: 'test@example.com',
          frequency: Frequency.Daily,
        },
        HttpStatus.BAD_REQUEST,
      );

      expect(validateCitySpy).toHaveBeenCalledWith('InvalidCity');
      expect(sendEmailSpy).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid email format', async () => {
      await subscribe(
        {
          city: 'London',
          email: 'invalid-email',
          frequency: Frequency.Daily,
        },
        HttpStatus.BAD_REQUEST,
      );

      expect(validateCitySpy).not.toHaveBeenCalled();
      expect(sendEmailSpy).not.toHaveBeenCalled();
    });

    it('returns 400 for missing required fields', async () => {
      await subscribe(
        {
          city: 'London',
        } as SubscribeOptions,
        HttpStatus.BAD_REQUEST,
      );

      expect(validateCitySpy).not.toHaveBeenCalled();
      expect(sendEmailSpy).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid frequency', async () => {
      await subscribe(
        {
          city: 'London',
          email: 'test@example.com',
          frequency: 'weekly',
        } as unknown as SubscribeOptions,
        HttpStatus.BAD_REQUEST,
      );

      expect(validateCitySpy).not.toHaveBeenCalled();
      expect(sendEmailSpy).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/subscribe form', () => {
    it('subscribes with 200 to the city with daily frequency', async () => {
      const { message } = await subscribeForm(
        {
          city: 'London',
          email: 'test@example.com',
          frequency: Frequency.Daily,
        },
        HttpStatus.OK,
      );

      expect(message).toBe('Subscription successful. Confirmation email sent.');

      expect(validateCitySpy).toHaveBeenCalledWith('London');
      expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['test@example.com'],
          template: expect.objectContaining({
            title: 'Confirm your weather subscription for London',
          }),
        }),
      );
    });

    it('subscribes with 200 to the city with hourly frequency', async () => {
      const { message } = await subscribeForm(
        {
          city: 'Paris',
          email: 'test@example.com',
          frequency: Frequency.Hourly,
        },
        HttpStatus.OK,
      );

      expect(message).toBe('Subscription successful. Confirmation email sent.');

      expect(validateCitySpy).toHaveBeenCalledWith('Paris');
      expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['test@example.com'],
          template: expect.objectContaining({
            title: 'Confirm your weather subscription for Paris',
          }),
        }),
      );
    });

    it('returns 409 when subscription already exists', async () => {
      await subscriptionRepository.createSubscription({
        email: 'test@example.com',
        city: 'London',
        frequency: Frequency.Daily,
      });

      await subscribeForm(
        {
          city: 'London',
          email: 'test@example.com',
          frequency: Frequency.Daily,
        },
        HttpStatus.CONFLICT,
      );

      expect(validateCitySpy).not.toHaveBeenCalled();
      expect(sendEmailSpy).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid city', async () => {
      validateCitySpy.mockImplementationOnce(async () => {
        throw Exception.ValidationError('Invalid city');
      });

      await subscribeForm(
        {
          city: 'InvalidCity',
          email: 'test@example.com',
          frequency: Frequency.Daily,
        },
        HttpStatus.BAD_REQUEST,
      );

      expect(validateCitySpy).toHaveBeenCalledWith('InvalidCity');
      expect(sendEmailSpy).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid email format', async () => {
      await subscribeForm(
        {
          city: 'London',
          email: 'invalid-email',
          frequency: Frequency.Daily,
        },
        HttpStatus.BAD_REQUEST,
      );

      expect(validateCitySpy).not.toHaveBeenCalled();
      expect(sendEmailSpy).not.toHaveBeenCalled();
    });

    it('returns 400 for missing required fields', async () => {
      await subscribeForm(
        {
          city: 'London',
        } as SubscribeOptions,
        HttpStatus.BAD_REQUEST,
      );

      expect(validateCitySpy).not.toHaveBeenCalled();
      expect(sendEmailSpy).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid frequency', async () => {
      await subscribeForm(
        {
          city: 'London',
          email: 'test@example.com',
          frequency: 'weekly',
        } as unknown as SubscribeOptions,
        HttpStatus.BAD_REQUEST,
      );

      expect(validateCitySpy).not.toHaveBeenCalled();
      expect(sendEmailSpy).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/confirm/{token}', () => {
    it('confirms subscription successfully', async () => {
      const subscribeData = {
        email: 'test@example.com',
        city: 'London',
        frequency: Frequency.Daily,
      };

      const token = await jwtProvider.sign(subscribeData);
      const { message } = await confirm(token, HttpStatus.OK);
      expect(message).toBe('Subscription confirmed successfully');

      const subscriptionInDb = await db.query.subscriptions.findMany({
        where: (subscriptions, { eq }) => eq(subscriptions.email, 'test@example.com'),
      });
      expect(subscriptionInDb).toHaveLength(1);
      expect(subscriptionInDb[0]?.city).toBe('London');
      expect(subscriptionInDb[0]?.frequency).toBe(Frequency.Daily);
    });

    it('returns 500 for invalid jwt token', async () => {
      const signer = createSigner({
        key: async () => 'test',
        expiresIn: 1800000, // in ms
      });

      const jwt = await signer({ test: true });
      await confirm(jwt, HttpStatus.INTERNAL_SERVER_ERROR);

      const subscriptionInDb = await db.query.subscriptions.findMany();
      expect(subscriptionInDb).toHaveLength(0);
    });

    it('returns 400 for invalid token', async () => {
      await confirm('invalid-token', HttpStatus.BAD_REQUEST);

      const subscriptionInDb = await db.query.subscriptions.findMany();
      expect(subscriptionInDb).toHaveLength(0);
    });

    it('returns 409 when subscription already exists', async () => {
      await subscriptionRepository.createSubscription({
        email: 'test@example.com',
        city: 'London',
        frequency: Frequency.Daily,
      });

      const token = await jwtProvider.sign({
        email: 'test@example.com',
        city: 'Berlin',
        frequency: Frequency.Hourly,
      });

      await confirm(token, HttpStatus.CONFLICT);

      const subscriptionInDb = await db.query.subscriptions.findMany({
        where: (subscriptions, { eq }) => eq(subscriptions.email, 'test@example.com'),
      });
      expect(subscriptionInDb).toHaveLength(1);
      expect(subscriptionInDb[0]?.city).toBe('London');
      expect(subscriptionInDb[0]?.frequency).toBe(Frequency.Daily);
    });
  });

  describe('GET /api/unsubscribe/{token}', () => {
    it('unsubscribes successfully', async () => {
      const subscription = await subscriptionRepository.createSubscription({
        email: 'test@example.com',
        city: 'London',
        frequency: Frequency.Daily,
      });

      const { message } = await unsubscribe(subscription.id, HttpStatus.OK);

      expect(message).toBe('Unsubscribed successfully');

      const subscriptionInDb = await db.query.subscriptions.findMany({
        where: (subscriptions, { eq }) => eq(subscriptions.id, subscription.id),
      });
      expect(subscriptionInDb).toHaveLength(0);
    });

    it('handles non-existent subscription gracefully', async () => {
      const nonExistentId = randomUUID();
      await unsubscribe(nonExistentId, HttpStatus.OK);

      const subscriptionInDb = await db.query.subscriptions.findMany();
      expect(subscriptionInDb).toHaveLength(0);
    });

    it('handles wrong token gracefully', async () => {
      await unsubscribe('test', HttpStatus.BAD_REQUEST);
    });
  });
});
