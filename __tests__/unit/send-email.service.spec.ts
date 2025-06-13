import { Mock } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { ResendSendEmailService, SendEmailOptions } from 'src/services/send-email.service.js';
import { Exception } from 'src/exception.js';

describe('ResendSendEmailService (unit)', () => {
  const EMAIL_NAME = 'Test App';
  const EMAIL_FROM = 'test@example.com';
  const RESEND_API_KEY = 'test_api_key';
  const RESEND_API_URL = 'https://api.resend.com/emails';

  let errorSpy: Mock;

  let sendEmailService: ResendSendEmailService;

  const server = setupServer(
    http.post(RESEND_API_URL, async ({ request }) => {
      const requestBody = (await request.json()) as Record<string, unknown>;

      const authHeader = request.headers.get('Authorization');
      if (authHeader !== `Bearer ${RESEND_API_KEY}`) {
        return new HttpResponse(JSON.stringify({ error: { message: 'Invalid API key' } }), { status: 401 });
      }

      return HttpResponse.json({
        id: 'mock-email-id',
        from: requestBody.from,
        to: requestBody.to,
      });
    }),
  );

  beforeAll(() => server.listen());

  beforeEach(() => {
    errorSpy = vitest.fn();

    sendEmailService = new ResendSendEmailService(
      { error: errorSpy, info: vi.fn() },
      EMAIL_NAME,
      EMAIL_FROM,
      RESEND_API_KEY,
    );
  });

  afterEach(() => {
    server.resetHandlers();
    vitest.clearAllMocks();
  });

  afterAll(() => server.close());

  describe('sendEmail', () => {
    it('successfully sends an email with HTML content', async () => {
      const emailOptions: SendEmailOptions = {
        to: ['recipient@example.com'],
        title: 'Test Email',
        html: '<p>This is a test email</p>',
      };

      await expect(sendEmailService.sendEmail(emailOptions)).resolves.not.toThrow();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('successfully sends an email with text content', async () => {
      const emailOptions: SendEmailOptions = {
        to: ['recipient@example.com'],
        title: 'Test Email',
        text: 'This is a test email',
      };

      await expect(sendEmailService.sendEmail(emailOptions)).resolves.not.toThrow();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('successfully sends an email to multiple recipients', async () => {
      const emailOptions: SendEmailOptions = {
        to: ['recipient1@example.com', 'recipient2@example.com'],
        title: 'Test Email',
        html: '<p>This is a test email</p>',
      };

      await expect(sendEmailService.sendEmail(emailOptions)).resolves.not.toThrow();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('throws an exception when the Resend API returns an error', async () => {
      server.use(
        http.post(RESEND_API_URL, async () => {
          return new HttpResponse(JSON.stringify({ error: { message: 'Failed to send email' } }), { status: 400 });
        }),
      );

      const emailOptions: SendEmailOptions = {
        to: ['error@example.com'],
        title: 'Test Email',
        html: '<p>This is a test email</p>',
      };

      await expect(sendEmailService.sendEmail(emailOptions)).rejects.toThrow(Exception);
      expect(errorSpy).toHaveBeenCalledWith({
        err: {
          error: {
            message: 'Failed to send email',
          },
        },
      });
    });

    it('formats the from address correctly with name and email', async () => {
      server.use(
        http.post(RESEND_API_URL, async ({ request }) => {
          const requestBody = (await request.json()) as Record<string, any>;
          expect(requestBody.from).toBe(`${EMAIL_NAME} <${EMAIL_FROM}>`);
          return HttpResponse.json({ id: 'mock-email-id' });
        }),
      );

      const emailOptions: SendEmailOptions = {
        to: ['recipient@example.com'],
        title: 'Test Email',
        html: '<p>This is a test email</p>',
      };

      await sendEmailService.sendEmail(emailOptions);
    });
  });
});
