import { Mock } from 'vitest';
import { SendEmailTemplateService } from 'src/services/send-email-template.service.js';
import { SendEmailService } from 'src/services/send-email.service.js';
import { createMock } from '__tests__/utils/mock.utils.js';
import { LoggerService } from 'src/services/logger.service.js';

describe('SendEmailTemplateService (unit)', () => {
  let service: SendEmailTemplateService;

  let sendEmailSpy: Mock;
  let loggerInfoSpy: Mock;

  beforeEach(() => {
    loggerInfoSpy = vitest.fn();
    sendEmailSpy = vitest.fn();

    service = new SendEmailTemplateService(
      createMock<SendEmailService>({ sendEmail: sendEmailSpy }),
      createMock<LoggerService>({ createLogger: () => ({ info: loggerInfoSpy, error: vi.fn() }) }),
    );
  });

  describe('sendSubscribeEmail', () => {
    it('sends subscribe email with correct parameters', async () => {
      const options = {
        to: 'test@example.com',
        city: 'New York',
        confirmationLink: 'https://example.com/confirm/123',
      };

      await service.sendSubscribeEmail(options);

      expect(sendEmailSpy).toHaveBeenCalledTimes(1);
      expect(sendEmailSpy).toHaveBeenCalledWith({
        to: [options.to],
        title: `Confirm your weather subscription for ${options.city}`,
        html: expect.stringContaining(options.confirmationLink),
        text: expect.stringContaining(options.city),
      });

      const emailCall = sendEmailSpy?.mock?.calls?.[0]?.[0];
      expect(emailCall.to).toEqual([options.to]);
      expect(emailCall.title).toBe(`Confirm your weather subscription for ${options.city}`);

      expect(emailCall.html).toContain(options.city);
      expect(emailCall.html).toContain(options.confirmationLink);

      expect(emailCall.text).toContain(options.city);
      expect(emailCall.text).toContain(options.confirmationLink);

      expect(loggerInfoSpy).toHaveBeenCalledWith({
        msg: 'Confirmation email sent',
        to: options.to,
        city: options.city,
      });
    });

    it('propagates errors from the email service', async () => {
      const options = {
        to: 'test@example.com',
        city: 'New York',
        confirmationLink: 'https://example.com/confirm/123',
      };

      const error = new Error('Email sending failed');
      sendEmailSpy.mockRejectedValue(error);

      await expect(service.sendSubscribeEmail(options)).rejects.toThrow(error);
      expect(sendEmailSpy).toHaveBeenCalledTimes(1);
      expect(loggerInfoSpy).not.toHaveBeenCalled();
    });
  });

  describe('sendWeatherUpdateEmail', () => {
    it('sends weather update email with correct parameters', async () => {
      const options = {
        to: 'test@example.com',
        city: 'New York',
        unsubscribeLink: 'https://example.com/unsubscribe/123',
        temperature: 25,
        humidity: 60,
        description: 'Sunny',
      };

      await service.sendWeatherUpdateEmail(options);

      expect(sendEmailSpy).toHaveBeenCalledTimes(1);
      expect(sendEmailSpy).toHaveBeenCalledWith({
        to: [options.to],
        title: `Weather update for ${options.city}`,
        html: expect.stringContaining(options.unsubscribeLink),
        text: expect.stringContaining(options.city),
      });

      const emailCall = sendEmailSpy?.mock?.calls?.[0]?.[0];
      expect(emailCall.to).toEqual([options.to]);
      expect(emailCall.title).toBe(`Weather update for ${options.city}`);

      expect(emailCall.html).toContain(options.city);
      expect(emailCall.html).toContain(options.unsubscribeLink);
      expect(emailCall.html).toContain(options.temperature.toString());
      expect(emailCall.html).toContain(options.humidity.toString());
      expect(emailCall.html).toContain(options.description);

      expect(emailCall.text).toContain(options.city);
      expect(emailCall.text).toContain(options.unsubscribeLink);
      expect(emailCall.text).toContain(options.temperature.toString());
      expect(emailCall.text).toContain(options.humidity.toString());
      expect(emailCall.text).toContain(options.description);

      expect(loggerInfoSpy).toHaveBeenCalledWith({
        msg: 'Weather update email sent',
        to: options.to,
        city: options.city,
      });
    });

    it('propagates errors from the email service', async () => {
      const options = {
        to: 'test@example.com',
        city: 'New York',
        unsubscribeLink: 'https://example.com/unsubscribe/123',
        temperature: 25,
        humidity: 60,
        description: 'Sunny',
      };

      const error = new Error('Email sending failed');
      sendEmailSpy.mockRejectedValue(error);

      await expect(service.sendWeatherUpdateEmail(options)).rejects.toThrow(error);
      expect(sendEmailSpy).toHaveBeenCalledTimes(1);
      expect(loggerInfoSpy).not.toHaveBeenCalled();
    });
  });
});
