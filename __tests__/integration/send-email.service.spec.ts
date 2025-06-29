import { Mock } from 'vitest';
import { http, HttpResponse, JsonBodyType } from 'msw';
import { SendEmailService } from 'src/services/send-email.service.js';
import { Exception } from 'src/exception.js';
import { createMockServer } from '__tests__/utils/mock-server.utils.js';
import { createMock } from '__tests__/utils/mock.utils.js';
import { LoggerService } from 'src/services/logger.service.js';

describe('SendEmailService (integration)', () => {
  const EMAIL_NAME = 'Test App';
  const EMAIL_FROM = 'test@example.com';
  const RESEND_API_KEY = 'test_api_key';

  let errorSpy: Mock;

  let sendEmailService: SendEmailService;

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
    unauthorized: () =>
      emailApi.mock(() => HttpResponse.json({ error: { message: 'Invalid API key' } }, { status: 401 })),
    badRequest: () =>
      emailApi.mock(() =>
        HttpResponse.json(
          {
            error: { message: 'Invalid request' },
          },
          { status: 400 },
        ),
      ),
  };

  beforeAll(() => {
    mockServer.start();
  });

  beforeEach(() => {
    errorSpy = vitest.fn();

    sendEmailService = new SendEmailService(
      createMock<LoggerService>({ createLogger: () => ({ error: errorSpy, info: vi.fn() }) }),
      { EMAIL_NAME, EMAIL_FROM, RESEND_API_KEY },
    );
  });

  afterEach(() => {
    // here is the solution used https://github.com/mswjs/msw/issues/946#issuecomment-1572768939
    expect(mockServer.onUnhandledRequest).not.toHaveBeenCalled();
    mockServer.onUnhandledRequest.mockClear();

    mockServer.clearHandlers();
    vitest.clearAllMocks();
  });

  afterAll(() => mockServer.stop());

  describe('sendEmail', () => {
    it('successfully sends an email with HTML content', async () => {
      mockServer.addHandlers(emailApi.ok());

      await expect(
        sendEmailService.sendEmail({
          to: ['recipient@example.com'],
          title: 'Test Email',
          html: '<p>This is a test email</p>',
        }),
      ).resolves.not.toThrow();

      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('successfully sends an email with text content', async () => {
      mockServer.addHandlers(emailApi.ok());

      await expect(
        sendEmailService.sendEmail({
          to: ['recipient@example.com'],
          title: 'Test Email',
          text: 'This is a test email',
        }),
      ).resolves.not.toThrow();

      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('successfully sends an email to multiple recipients', async () => {
      mockServer.addHandlers(emailApi.ok());

      await expect(
        sendEmailService.sendEmail({
          to: ['recipient1@example.com', 'recipient2@example.com'],
          title: 'Test Email',
          html: '<p>This is a test email</p>',
        }),
      ).resolves.not.toThrow();

      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('throws an exception when the Resend API returns 400', async () => {
      mockServer.addHandlers(emailApi.badRequest());

      await expect(
        sendEmailService.sendEmail({
          to: ['error@example.com'],
          title: 'Test Email',
          html: '<p>This is a test email</p>',
        }),
      ).rejects.toThrow(Exception);

      expect(errorSpy).toHaveBeenCalledWith({
        err: {
          error: {
            message: 'Invalid request',
          },
        },
      });
    });

    it('throws an exception when the Resend API returns 401', async () => {
      mockServer.addHandlers(emailApi.unauthorized());

      await expect(
        sendEmailService.sendEmail({
          to: ['error@example.com'],
          title: 'Test Email',
          html: '<p>This is a test email</p>',
        }),
      ).rejects.toThrow(Exception);

      expect(errorSpy).toHaveBeenCalledWith({
        err: {
          error: {
            message: 'Invalid API key',
          },
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

      await sendEmailService.sendEmail({
        to: ['recipient@example.com'],
        title: 'Test Email',
        html: '<p>This is a test email</p>',
      });
    });
  });
});
