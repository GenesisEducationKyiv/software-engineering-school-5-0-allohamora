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

    service = new SendEmailTemplateService({
      sendEmailService: createMock<SendEmailService>({ sendEmail: sendEmailSpy }),
      loggerService: createMock<LoggerService>({ createLogger: () => ({ info: loggerInfoSpy, error: vi.fn() }) }),
    });
  });

  describe('sendSubscribeEmail', () => {
    it('sends subscribe email with correct parameters', async () => {
      const to = 'test@example.com';
      const city = 'New York';
      const confirmationLink = 'https://example.com/confirm/123';

      await service.sendSubscribeEmail({ to, city, confirmationLink });

      expect(sendEmailSpy).toHaveBeenCalledTimes(1);
      expect(sendEmailSpy).toHaveBeenCalledWith({
        to: [to],
        title: `Confirm your weather subscription for ${city}`,
        html: expect.stringContaining(confirmationLink),
        text: expect.stringContaining(city),
      });

      const emailCall = sendEmailSpy?.mock?.calls?.[0]?.[0];
      expect(emailCall.to).toEqual([to]);
      expect(emailCall.title).toBe(`Confirm your weather subscription for ${city}`);

      expect(emailCall.html).toContain(city);
      expect(emailCall.html).toContain(confirmationLink);

      expect(emailCall.text).toContain(city);
      expect(emailCall.text).toContain(confirmationLink);

      expect(loggerInfoSpy).toHaveBeenCalledWith({
        msg: 'Confirmation email sent',
        to,
        city,
      });
    });

    it('propagates errors from the email service', async () => {
      const to = 'test@example.com';
      const city = 'New York';
      const confirmationLink = 'https://example.com/confirm/123';

      const error = new Error('Email sending failed');
      sendEmailSpy.mockRejectedValue(error);

      await expect(service.sendSubscribeEmail({ to, city, confirmationLink })).rejects.toThrow(error);
      expect(sendEmailSpy).toHaveBeenCalledTimes(1);
      expect(loggerInfoSpy).not.toHaveBeenCalled();
    });
  });

  describe('sendWeatherUpdateEmail', () => {
    it('sends weather update email with correct parameters', async () => {
      const to = 'test@example.com';
      const city = 'New York';
      const unsubscribeLink = 'https://example.com/unsubscribe/123';
      const temperature = 25;
      const humidity = 60;
      const description = 'Sunny';

      await service.sendWeatherUpdateEmail({ to, city, unsubscribeLink, temperature, humidity, description });

      expect(sendEmailSpy).toHaveBeenCalledTimes(1);
      expect(sendEmailSpy).toHaveBeenCalledWith({
        to: [to],
        title: `Weather update for ${city}`,
        html: expect.stringContaining(unsubscribeLink),
        text: expect.stringContaining(city),
      });

      const emailCall = sendEmailSpy?.mock?.calls?.[0]?.[0];
      expect(emailCall.to).toEqual([to]);
      expect(emailCall.title).toBe(`Weather update for ${city}`);

      expect(emailCall.html).toContain(city);
      expect(emailCall.html).toContain(unsubscribeLink);
      expect(emailCall.html).toContain(temperature.toString());
      expect(emailCall.html).toContain(humidity.toString());
      expect(emailCall.html).toContain(description);

      expect(emailCall.text).toContain(city);
      expect(emailCall.text).toContain(unsubscribeLink);
      expect(emailCall.text).toContain(temperature.toString());
      expect(emailCall.text).toContain(humidity.toString());
      expect(emailCall.text).toContain(description);

      expect(loggerInfoSpy).toHaveBeenCalledWith({
        msg: 'Weather update email sent',
        to,
        city,
      });
    });

    it('propagates errors from the email service', async () => {
      const error = new Error('Email sending failed');
      sendEmailSpy.mockRejectedValue(error);

      await expect(
        service.sendWeatherUpdateEmail({
          to: 'test@example.com',
          city: 'New York',
          unsubscribeLink: 'https://example.com/unsubscribe/123',
          temperature: 25,
          humidity: 60,
          description: 'Sunny',
        }),
      ).rejects.toThrow(error);

      expect(sendEmailSpy).toHaveBeenCalledTimes(1);
      expect(loggerInfoSpy).not.toHaveBeenCalled();
    });
  });
});
