import { beforeEach, describe, expect, it } from 'vitest';
import { TemplateService } from 'src/services/template.service.js';

describe('TemplateService (unit)', () => {
  let templateService: TemplateService;

  beforeEach(() => {
    templateService = new TemplateService();
  });

  describe('getSubscribeTemplate', () => {
    it('creates subscribe email with correct parameters', () => {
      const city = 'New York';
      const confirmationLink = 'https://example.com/confirm/123';

      const { title, html, text } = templateService.getSubscribeTemplate({ city, confirmationLink });

      expect(title).toBe(`Confirm your weather subscription for ${city}`);

      expect(html).toContain(city);
      expect(html).toContain(confirmationLink);

      expect(text).toContain(city);
      expect(text).toContain(confirmationLink);
    });
  });

  describe('getWeatherUpdateTemplate', () => {
    it('creates weather update email with correct parameters', () => {
      const city = 'New York';
      const unsubscribeLink = 'https://example.com/unsubscribe/123';
      const temperature = 25;
      const humidity = 60;
      const description = 'Sunny';

      const { title, html, text } = templateService.getWeatherUpdateTemplate({
        city,
        unsubscribeLink,
        temperature,
        humidity,
        description,
      });

      expect(title).toBe(`Weather update for ${city}`);

      expect(html).toContain(city);
      expect(html).toContain(unsubscribeLink);
      expect(html).toContain(temperature.toString());
      expect(html).toContain(humidity.toString());
      expect(html).toContain(description);

      expect(text).toContain(city);
      expect(text).toContain(unsubscribeLink);
      expect(text).toContain(temperature.toString());
      expect(text).toContain(humidity.toString());
      expect(text).toContain(description);
    });
  });
});
