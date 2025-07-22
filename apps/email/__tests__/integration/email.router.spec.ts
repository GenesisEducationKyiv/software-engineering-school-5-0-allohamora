import '../mocks/config.service.mock.js';
import { beforeAll, afterAll, describe, it, expect, afterEach } from 'vitest';
import { createChannel, createClient, ClientError } from 'nice-grpc';
import { EmailServiceDefinition } from '@weather-subscription/proto/email';
import { Server } from 'src/server.js';
import { http, HttpResponse } from 'msw';
import { createMockServer } from '__tests__/utils/mock-server.utils.js';
import { Container } from 'src/container.js';

describe('email router (integration)', () => {
  const mockServer = createMockServer();

  let server: Server;
  let emailClient: ReturnType<typeof createClient<typeof EmailServiceDefinition>>;

  const emailApi = {
    ok: () =>
      http.post('https://api.resend.com/emails', () =>
        HttpResponse.json({
          id: 'mock-email-id',
          from: 'Test App <test@example.com>',
          to: ['test@example.com'],
        }),
      ),
    badRequest: () =>
      http.post('https://api.resend.com/emails', () =>
        HttpResponse.json({ error: { message: 'Invalid request' } }, { status: 400 }),
      ),
    unauthorized: () =>
      http.post('https://api.resend.com/emails', () =>
        HttpResponse.json({ error: { message: 'Invalid API key' } }, { status: 401 }),
      ),
  };

  beforeAll(async () => {
    ({ server } = new Container());

    const port = await server.listen(0);

    emailClient = createClient(EmailServiceDefinition, createChannel(`localhost:${port}`));

    mockServer.start();
  });

  afterEach(() => {
    // here is the solution used https://github.com/mswjs/msw/issues/946#issuecomment-1572768939
    expect(mockServer.onUnhandledRequest).not.toHaveBeenCalled();
    mockServer.onUnhandledRequest.mockClear();

    mockServer.clearHandlers();
  });

  afterAll(async () => {
    await server.close();

    mockServer.stop();
  });

  describe('sendSubscribeEmail', () => {
    it('successfully sends subscription email', async () => {
      mockServer.addHandlers(emailApi.ok());

      const result = await emailClient.sendSubscribeEmail({
        to: ['test@example.com'],
        city: 'London',
        confirmationLink: 'https://example.com/confirm/token123',
      });

      expect(result).toEqual({});
    });

    it('successfully sends subscription email to multiple recipients', async () => {
      mockServer.addHandlers(emailApi.ok());

      const result = await emailClient.sendSubscribeEmail({
        to: ['test1@example.com', 'test2@example.com'],
        city: 'Paris',
        confirmationLink: 'https://example.com/confirm/token456',
      });

      expect(result).toEqual({});
    });

    it('throws error when email sending fails with 400 error', async () => {
      mockServer.addHandlers(emailApi.badRequest());

      await expect(
        emailClient.sendSubscribeEmail({
          to: ['error@example.com'],
          city: 'London',
          confirmationLink: 'https://example.com/confirm/token123',
        }),
      ).rejects.toThrow(ClientError);
    });

    it('throws error when email sending fails with 401 error', async () => {
      mockServer.addHandlers(emailApi.unauthorized());

      await expect(
        emailClient.sendSubscribeEmail({
          to: ['error@example.com'],
          city: 'London',
          confirmationLink: 'https://example.com/confirm/token123',
        }),
      ).rejects.toThrow(ClientError);
    });
  });

  describe('sendWeatherUpdateEmail', () => {
    it('successfully sends weather update email', async () => {
      mockServer.addHandlers(emailApi.ok());

      const result = await emailClient.sendWeatherUpdateEmail({
        to: ['subscriber@example.com'],
        city: 'London',
        unsubscribeLink: 'https://example.com/unsubscribe/token789',
        temperature: 25.5,
        humidity: 60,
        description: 'Partly cloudy',
      });

      expect(result).toEqual({});
    });

    it('successfully sends weather update email to multiple recipients', async () => {
      mockServer.addHandlers(emailApi.ok());

      const result = await emailClient.sendWeatherUpdateEmail({
        to: ['subscriber1@example.com', 'subscriber2@example.com'],
        city: 'Tokyo',
        unsubscribeLink: 'https://example.com/unsubscribe/token999',
        temperature: 18.2,
        humidity: 75,
        description: 'Light rain',
      });

      expect(result).toEqual({});
    });

    it('throws exception when email sending fails with 400 error', async () => {
      mockServer.addHandlers(emailApi.badRequest());

      await expect(
        emailClient.sendWeatherUpdateEmail({
          to: ['error@example.com'],
          city: 'London',
          unsubscribeLink: 'https://example.com/unsubscribe/token789',
          temperature: 25.5,
          humidity: 60,
          description: 'Partly cloudy',
        }),
      ).rejects.toThrow(ClientError);
    });

    it('throws exception when email sending fails with 401 error', async () => {
      mockServer.addHandlers(emailApi.unauthorized());

      await expect(
        emailClient.sendWeatherUpdateEmail({
          to: ['error@example.com'],
          city: 'London',
          unsubscribeLink: 'https://example.com/unsubscribe/token789',
          temperature: 25.5,
          humidity: 60,
          description: 'Partly cloudy',
        }),
      ).rejects.toThrow(ClientError);
    });
  });
});
