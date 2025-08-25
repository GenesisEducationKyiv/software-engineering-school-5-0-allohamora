import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, Mock, vitest } from 'vitest';
import { http, HttpResponse, JsonBodyType } from 'msw';
import { EmailService } from 'src/services/email.service.js';
import { createMockServer } from '__tests__/utils/mock-server.utils.js';
import { createMock } from '__tests__/utils/mock.utils.js';
import {
  LoggerService,
  Exception,
  CacheService,
  MetricsService,
  CacheMetricsService,
} from '@weather-subscription/shared';
import { TemplateService } from 'src/services/template.service.js';

describe('EmailService (integration)', () => {
  const EMAIL_NAME = 'Test App';
  const EMAIL_FROM = 'test@example.com';
  const RESEND_API_KEY = 'test_api_key';

  const EMAIL_IGNORE_TTL_SECONDS = 300;
  const REDIS_URL = 'redis://:example@localhost:6379/1';

  let errorSpy: Mock;
  let infoSpy: Mock;

  let emailService: EmailService;
  let cacheService: CacheService;

  const mockServer = createMockServer();

  const emailApi = {
    mock: (fn: (requestBody: Record<string, unknown>) => HttpResponse<JsonBodyType>) => {
      return http.post('https://api.resend.com/emails', async ({ request }) => {
        const requestBody = (await request.json()) as Record<string, unknown>;

        return fn(requestBody);
      });
    },
    ok: () =>
      emailApi.mock(({ from, to }) =>
        HttpResponse.json({
          id: 'mock-email-id',
          from,
          to,
        }),
      ),
    unauthorized: () => emailApi.mock(() => HttpResponse.json({ message: 'Invalid API key' }, { status: 401 })),
    badRequest: () => emailApi.mock(() => HttpResponse.json({ message: 'Invalid request' }, { status: 400 })),
  };

  beforeAll(() => {
    mockServer.start();
  });

  beforeEach(() => {
    errorSpy = vitest.fn();
    infoSpy = vitest.fn();

    const loggerService = createMock<LoggerService>({
      createLogger: () => ({
        debug: vitest.fn(),
        info: infoSpy,
        warn: vitest.fn(),
        error: errorSpy,
      }),
    });

    const metricsService = new MetricsService({
      loggerService,
      config: {
        PROMETHEUS_JOB_NAME: 'test',
        PROMETHEUS_PUSHGATEWAY_URL: 'http://localhost:9091',
        PROMETHEUS_PUSH_DELAY: 100,
      },
    });

    const cacheMetricsService = new CacheMetricsService({
      metricsService,
    });

    cacheService = new CacheService({
      cacheMetricsService,
      loggerService,
      config: { REDIS_URL },
    });

    emailService = new EmailService({
      templateService: new TemplateService(),
      cacheService,
      loggerService,
      config: { EMAIL_NAME, EMAIL_FROM, RESEND_API_KEY, EMAIL_IGNORE_TTL_SECONDS },
    });
  });

  afterEach(async () => {
    // here is the solution used https://github.com/mswjs/msw/issues/946#issuecomment-1572768939
    expect(mockServer.onUnhandledRequest).not.toHaveBeenCalled();
    mockServer.onUnhandledRequest.mockClear();

    mockServer.clearHandlers();
    await cacheService.clearAll();
    vitest.clearAllMocks();
  });

  afterAll(() => {
    mockServer.stop();
  });

  describe('sendEmail', () => {
    it('successfully sends an email with HTML and text content', async () => {
      mockServer.addHandlers(emailApi.ok());

      await expect(
        emailService.sendEmail({
          to: ['recipient@example.com'],
          template: {
            title: 'Test Email',
            html: '<p>This is a test email</p>',
            text: 'This is a test email',
          },
        }),
      ).resolves.not.toThrow();

      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('successfully sends an email to multiple recipients', async () => {
      mockServer.addHandlers(emailApi.ok());

      await expect(
        emailService.sendEmail({
          to: ['recipient1@example.com', 'recipient2@example.com'],
          template: {
            title: 'Test Email',
            html: '<p>This is a test email</p>',
            text: 'This is a test email',
          },
        }),
      ).resolves.not.toThrow();

      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('throws an exception when the Resend API returns 400', async () => {
      mockServer.addHandlers(emailApi.badRequest());

      await expect(
        emailService.sendEmail({
          to: ['error@example.com'],
          template: {
            title: 'Test Email',
            html: '<p>This is a test email</p>',
            text: 'This is a test email',
          },
        }),
      ).rejects.toThrow(Exception.InternalServerError('Invalid request'));

      expect(errorSpy).toHaveBeenCalledWith({
        err: {
          message: 'Invalid request',
        },
      });
    });

    it('throws an exception when the Resend API returns 401', async () => {
      mockServer.addHandlers(emailApi.unauthorized());

      await expect(
        emailService.sendEmail({
          to: ['error@example.com'],
          template: {
            title: 'Test Email',
            html: '<p>This is a test email</p>',
            text: 'This is a test email',
          },
        }),
      ).rejects.toThrow(Exception.InternalServerError('Invalid API key'));

      expect(errorSpy).toHaveBeenCalledWith({
        err: {
          message: 'Invalid API key',
        },
      });
    });

    it('formats the from address correctly with name and email', async () => {
      mockServer.addHandlers(
        emailApi.mock(({ from }) => {
          expect(from).toBe(`${EMAIL_NAME} <${EMAIL_FROM}>`);

          return HttpResponse.json({ id: 'mock-email-id' }, { status: 200 });
        }),
      );

      await emailService.sendEmail({
        to: ['recipient@example.com'],
        template: {
          title: 'Test Email',
          html: '<p>This is a test email</p>',
          text: 'This is a test email',
        },
      });

      expect.assertions(1);
    });

    it('sends email when cache is empty', async () => {
      mockServer.addHandlers(emailApi.ok());

      await expect(
        emailService.sendEmail({
          to: ['recipient@example.com'],
          template: {
            title: 'Test Email',
            html: '<p>This is a test email</p>',
            text: 'This is a test email',
          },
        }),
      ).resolves.not.toThrow();

      expect(errorSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();
    });

    it('ignores email when cache indicates it was recently sent', async () => {
      mockServer.addHandlers(emailApi.ok());

      const emailOptions = {
        to: ['recipient@example.com'],
        template: {
          title: 'Test Email',
          html: '<p>This is a test email</p>',
          text: 'This is a test email',
        },
      };

      await emailService.sendEmail(emailOptions);

      mockServer.clearHandlers();

      await expect(emailService.sendEmail(emailOptions)).resolves.not.toThrow();

      expect(infoSpy).toHaveBeenCalledWith({
        msg: 'Email was ignored',
        to: emailOptions.to,
        title: emailOptions.template.title,
      });
    });

    it('differentiates between emails with same recipients but different titles', async () => {
      mockServer.addHandlers(emailApi.ok());

      const to = ['recipient@example.com'];

      const email1 = {
        to,
        template: {
          title: 'First Email',
          html: '<p>First email</p>',
          text: 'First email',
        },
      };

      const email2 = {
        to,
        template: {
          title: 'Second Email',
          html: '<p>Second email</p>',
          text: 'Second email',
        },
      };

      await emailService.sendEmail(email1);
      await emailService.sendEmail(email2);

      expect(infoSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Email was ignored',
        }),
      );
    });

    it('differentiates between emails with same title but different recipients', async () => {
      mockServer.addHandlers(emailApi.ok());

      const baseTemplate = {
        title: 'Test Email',
        html: '<p>Test email</p>',
        text: 'Test email',
      };

      const email1 = {
        to: ['recipient1@example.com'],
        template: baseTemplate,
      };

      const email2 = {
        to: ['recipient2@example.com'],
        template: baseTemplate,
      };

      await emailService.sendEmail(email1);
      await emailService.sendEmail(email2);

      expect(infoSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Email was ignored',
        }),
      );
    });

    it('correctly handles cache for multiple recipients and ignores recent sends', async () => {
      mockServer.addHandlers(emailApi.ok());

      const email = {
        to: ['recipient1@example.com', 'recipient2@example.com'],
        template: {
          title: 'Test Email',
          html: '<p>This is a test email</p>',
          text: 'This is a test email',
        },
      };

      await emailService.sendEmail(email);

      mockServer.clearHandlers();

      await expect(emailService.sendEmail(email)).resolves.not.toThrow();

      expect(infoSpy).toHaveBeenCalledWith({
        msg: 'Email was ignored',
        to: email.to,
        title: email.template.title,
      });
    });

    it('differentiates between different recipient combinations', async () => {
      mockServer.addHandlers(emailApi.ok());

      const template = {
        title: 'Test Email',
        html: '<p>Test email</p>',
        text: 'Test email',
      };

      const email1 = {
        to: ['recipient1@example.com', 'recipient2@example.com'],
        template,
      };

      const email2 = {
        to: ['recipient3@example.com', 'recipient2@example.com'],
        template,
      };

      await emailService.sendEmail(email1);
      await emailService.sendEmail(email2);

      expect(infoSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Email was ignored',
        }),
      );
    });

    it('ignores the same recipients in different order', async () => {
      const baseTemplate = {
        title: 'Test Email',
        html: '<p>Test email</p>',
        text: 'Test email',
      };

      const email1 = {
        to: ['recipient2@example.com', 'recipient1@example.com'],
        template: baseTemplate,
      };

      const email2 = {
        to: ['recipient1@example.com', 'recipient2@example.com'],
        template: baseTemplate,
      };

      mockServer.addHandlers(emailApi.ok());

      await emailService.sendEmail(email1);
      await emailService.sendEmail(email2);

      expect(infoSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Email was ignored',
        }),
      );
    });
  });

  describe('sendSubscribeEmail', () => {
    it('successfully sends subscription email', async () => {
      mockServer.addHandlers(emailApi.ok());

      await expect(
        emailService.sendSubscribeEmail({
          to: ['test@example.com'],
          city: 'London',
          confirmationLink: 'https://example.com/confirm/token123',
        }),
      ).resolves.not.toThrow();

      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('successfully sends subscription email to multiple recipients', async () => {
      mockServer.addHandlers(emailApi.ok());

      await expect(
        emailService.sendSubscribeEmail({
          to: ['test1@example.com', 'test2@example.com'],
          city: 'Paris',
          confirmationLink: 'https://example.com/confirm/token456',
        }),
      ).resolves.not.toThrow();

      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('throws error when email sending fails with 400 error', async () => {
      mockServer.addHandlers(emailApi.badRequest());

      await expect(
        emailService.sendSubscribeEmail({
          to: ['error@example.com'],
          city: 'London',
          confirmationLink: 'https://example.com/confirm/token123',
        }),
      ).rejects.toThrow(Exception.InternalServerError('Invalid request'));

      expect(errorSpy).toHaveBeenCalledWith({
        err: {
          message: 'Invalid request',
        },
      });
    });

    it('throws error when email sending fails with 401 error', async () => {
      mockServer.addHandlers(emailApi.unauthorized());

      await expect(
        emailService.sendSubscribeEmail({
          to: ['error@example.com'],
          city: 'London',
          confirmationLink: 'https://example.com/confirm/token123',
        }),
      ).rejects.toThrow(Exception.InternalServerError('Invalid API key'));

      expect(errorSpy).toHaveBeenCalledWith({
        err: {
          message: 'Invalid API key',
        },
      });
    });
  });

  describe('sendWeatherUpdateEmail', () => {
    it('successfully sends weather update email', async () => {
      mockServer.addHandlers(emailApi.ok());

      await expect(
        emailService.sendWeatherUpdateEmail({
          to: ['subscriber@example.com'],
          city: 'London',
          unsubscribeLink: 'https://example.com/unsubscribe/token789',
          temperature: 25.5,
          humidity: 60,
          description: 'Partly cloudy',
        }),
      ).resolves.not.toThrow();

      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('successfully sends weather update email to multiple recipients', async () => {
      mockServer.addHandlers(emailApi.ok());

      await expect(
        emailService.sendWeatherUpdateEmail({
          to: ['subscriber1@example.com', 'subscriber2@example.com'],
          city: 'Tokyo',
          unsubscribeLink: 'https://example.com/unsubscribe/token999',
          temperature: 18.2,
          humidity: 75,
          description: 'Light rain',
        }),
      ).resolves.not.toThrow();

      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('throws exception when email sending fails with 400 error', async () => {
      mockServer.addHandlers(emailApi.badRequest());

      await expect(
        emailService.sendWeatherUpdateEmail({
          to: ['error@example.com'],
          city: 'London',
          unsubscribeLink: 'https://example.com/unsubscribe/token789',
          temperature: 25.5,
          humidity: 60,
          description: 'Partly cloudy',
        }),
      ).rejects.toThrow(Exception.InternalServerError('Invalid request'));

      expect(errorSpy).toHaveBeenCalledWith({
        err: {
          message: 'Invalid request',
        },
      });
    });

    it('throws exception when email sending fails with 401 error', async () => {
      mockServer.addHandlers(emailApi.unauthorized());

      await expect(
        emailService.sendWeatherUpdateEmail({
          to: ['error@example.com'],
          city: 'London',
          unsubscribeLink: 'https://example.com/unsubscribe/token789',
          temperature: 25.5,
          humidity: 60,
          description: 'Partly cloudy',
        }),
      ).rejects.toThrow(Exception.InternalServerError('Invalid API key'));

      expect(errorSpy).toHaveBeenCalledWith({
        err: {
          message: 'Invalid API key',
        },
      });
    });
  });
});
