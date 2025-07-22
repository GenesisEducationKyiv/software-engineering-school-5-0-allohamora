import '../mocks/config.service.mock.js';
import { ServerType } from '@hono/node-server';
import { Browser, chromium, Page } from 'playwright';
import { Server } from 'src/server.js';
import { Container } from 'src/container.js';
import { Frequency } from '@weather-subscription/shared';
import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll, vi, MockInstance } from 'vitest';
import { createMockServer } from '__tests__/utils/mock-server.utils.js';

describe('Root Page E2E Tests', () => {
  let BASE_URL: string;

  let browser: Browser;
  let page: Page;

  let server: Server;
  let httpServer: ServerType;
  let container: Container;

  let subscribeSpy: MockInstance;
  let weatherSpy: MockInstance;

  const mockServer = createMockServer();

  const form = {
    submitButton: () => page.locator('button[type="submit"]'),
    submit: async () => await form.submitButton().click(),
    email: () => page.locator('#email'),
    city: () => page.locator('#city'),
    frequency: () => page.locator('#frequency'),
  };

  beforeAll(async () => {
    container = new Container();

    server = container.server;

    const { info, server: serverInstance } = await server.serve(0);

    BASE_URL = `http://localhost:${info.port}`;
    httpServer = serverInstance;

    browser = await chromium.launch();

    mockServer.start();
  });

  beforeEach(async () => {
    page = await browser.newPage();

    subscribeSpy = vi.spyOn(container.subscriptionClient, 'subscribe').mockImplementation(vi.fn());
    weatherSpy = vi.spyOn(container.weatherClient, 'getWeather').mockImplementation(vi.fn());
  });

  afterEach(async () => {
    await page.close();

    subscribeSpy.mockRestore();
    weatherSpy.mockRestore();

    // here is the solution used https://github.com/mswjs/msw/issues/946#issuecomment-1572768939
    expect(mockServer.onUnhandledRequest).not.toHaveBeenCalled();
    mockServer.onUnhandledRequest.mockClear();

    mockServer.clearHandlers();
  });

  afterAll(async () => {
    await browser.close();
    httpServer.close();

    mockServer.stop();
  });

  it('loads root page correctly', async () => {
    await page.goto(BASE_URL);

    expect(await page.title()).toBe('Weather App');

    const header = await page.locator('h1').textContent();
    expect(header?.trim()).toBe('Weather Updates');

    const formElement = await page.locator('#subscribe-form').isVisible();
    expect(formElement).toBe(true);
  });

  it('has all form elements and they are interactive', async () => {
    await page.goto(BASE_URL);

    const emailInput = await form.email().isVisible();
    const cityInput = await form.city().isVisible();
    const frequencySelect = await form.frequency().isVisible();
    const submitButton = await form.submitButton().isVisible();

    expect(emailInput).toBe(true);
    expect(cityInput).toBe(true);
    expect(frequencySelect).toBe(true);
    expect(submitButton).toBe(true);

    await form.email().fill('test@example.com');
    const emailValue = await form.email().inputValue();
    expect(emailValue).toBe('test@example.com');

    await form.city().fill('London');
    const cityValue = await form.city().inputValue();
    expect(cityValue).toBe('London');

    const options = await form.frequency().locator('option').count();
    expect(options).toBe(2);

    await form.frequency().selectOption('hourly');
    const frequencyValue = await form.frequency().inputValue();
    expect(frequencyValue).toBe('hourly');
  });

  it.each([Frequency.Daily, Frequency.Hourly])(
    'submits form and handles successful response with %s frequency',
    async (frequency: Frequency) => {
      subscribeSpy.mockResolvedValue({
        message: 'Subscription successful. Confirmation email sent.',
      });

      await page.goto(BASE_URL);

      await form.email().fill('test@example.com');
      await form.city().fill('London');
      await form.frequency().selectOption(frequency);

      const responsePromise = page.waitForResponse((response) => response.url().includes('/api/subscribe'));

      await form.submit();

      const response = await responsePromise;

      expect(response.status()).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        message: 'Subscription successful. Confirmation email sent.',
      });
    },
  );

  it.each([Frequency.Daily, Frequency.Hourly])(
    'does not send email when invalid city is provided with %s frequency',
    async (frequency: Frequency) => {
      subscribeSpy.mockRejectedValue(new Error('City not found'));

      await page.goto(BASE_URL);

      await form.email().fill('test@example.com');
      await form.city().fill('InvalidCity');
      await form.frequency().selectOption(frequency);

      const responsePromise = page.waitForResponse((response) => response.url().includes('/api/subscribe'));

      await form.submit();

      const response = await responsePromise;
      expect(response.status()).toBe(500);

      expect(subscribeSpy).toHaveBeenCalled();
    },
  );

  it('validates required fields', async () => {
    await page.goto(BASE_URL);

    await form.submit();

    expect(page.url()).toContain(BASE_URL.replace(/\/$/, ''));

    const emailValid = await form.email().evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(emailValid).toBe(false);
  });
});
