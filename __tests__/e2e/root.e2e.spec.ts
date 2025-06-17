import '../mocks/config.mock.js';
import { ServerType } from '@hono/node-server';
import { DrizzleDb, DrizzleDbService } from 'src/services/db.service.js';
import { Browser, chromium, Page } from 'playwright';
import { Server } from 'src/server.js';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { makeDeps } from 'src/deps.js';
import { ConfigService } from 'src/services/config.service.js';

describe('Root Page E2E Tests', () => {
  let BASE_URL: string;

  let browser: Browser;
  let page: Page;

  let configService: ConfigService;
  let dbService: DrizzleDbService;
  let db: DrizzleDb;
  let server: Server;
  let httpServer: ServerType;

  const sendEmailSpy = vitest.fn();

  const mswServer = setupServer(
    http.get('https://api.weatherapi.com/v1/current.json', ({ request }) => {
      const url = new URL(request.url);
      const city = url.searchParams.get('q');

      if (city !== 'London') {
        return HttpResponse.json(
          {
            error: {
              code: 1006,
              message: 'No matching location found.',
            },
          },
          { status: 400 },
        );
      }

      return HttpResponse.json({
        location: {
          name: 'London',
          region: 'City of London, Greater London',
          country: 'United Kingdom',
          lat: 51.5171,
          lon: -0.1062,
          tz_id: 'Europe/London',
          localtime_epoch: 1747148529,
          localtime: '2025-05-13 16:02',
        },
        current: {
          last_updated_epoch: 1747148400,
          last_updated: '2025-05-13 16:00',
          temp_c: 20,
          temp_f: 68.4,
          is_day: 1,
          condition: {
            text: 'Sunny',
            icon: '//cdn.weatherapi.com/weather/64x64/day/113.png',
            code: 1000,
          },
          wind_mph: 11.4,
          wind_kph: 18.4,
          wind_degree: 81,
          wind_dir: 'E',
          pressure_mb: 1018.0,
          pressure_in: 30.06,
          precip_mm: 0.0,
          precip_in: 0.0,
          humidity: 50,
          cloud: 0,
          feelslike_c: 20.2,
          feelslike_f: 68.4,
          vis_km: 10.0,
          vis_miles: 6.0,
          uv: 3.2,
          gust_mph: 13.1,
          gust_kph: 21.1,
        },
      });
    }),
    http.post('https://api.resend.com/emails', async ({ request }) => {
      const requestBody = (await request.json()) as Record<string, unknown>;

      sendEmailSpy(requestBody);

      return HttpResponse.json({
        id: 'mock-email-id',
        from: requestBody.from,
        to: requestBody.to,
      });
    }),
    http.all('*', ({ request }) => {
      console.error(`[MSW] Request not in whitelist: ${request.method} ${request.url}`);
      return HttpResponse.error();
    }),
  );

  beforeAll(async () => {
    mswServer.listen();

    ({ dbService, configService, server } = makeDeps());

    db = dbService.getConnection();

    const { info, server: serverInstance } = await server.serve(0);

    BASE_URL = `http://localhost:${info.port}`;
    httpServer = serverInstance;

    await dbService.runMigrations();
    browser = await chromium.launch();
  });

  beforeEach(async () => {
    page = await browser.newPage();

    sendEmailSpy.mockReset();
  });

  afterEach(async () => {
    await dbService.clearDb();
    await page.close();

    mswServer.resetHandlers();
  });

  const expectNoSubscriptions = async () => {
    const subscriptions = await db.query.subscriptions.findMany();
    expect(subscriptions.length).toBe(0);
  };

  afterAll(async () => {
    mswServer.close();

    await dbService.disconnectFromDb();
    await browser.close();
    httpServer.close();
  });

  it('loads root page correctly', async () => {
    await page.goto(BASE_URL);

    expect(await page.title()).toBe('Weather App');

    const header = await page.locator('h1').textContent();
    expect(header?.trim()).toBe('Weather Updates');

    const form = await page.locator('#subscribe-form').isVisible();
    expect(form).toBe(true);

    expect(sendEmailSpy).not.toHaveBeenCalled();
    await expectNoSubscriptions();
  });

  it('has all form elements and they are interactive', async () => {
    await page.goto(BASE_URL);

    const emailInput = await page.locator('#email').isVisible();
    const cityInput = await page.locator('#city').isVisible();
    const frequencySelect = await page.locator('#frequency').isVisible();
    const submitButton = await page.locator('button[type="submit"]').isVisible();

    expect(emailInput).toBe(true);
    expect(cityInput).toBe(true);
    expect(frequencySelect).toBe(true);
    expect(submitButton).toBe(true);

    await page.locator('#email').fill('test@example.com');
    const emailValue = await page.locator('#email').inputValue();
    expect(emailValue).toBe('test@example.com');

    await page.locator('#city').fill('London');
    const cityValue = await page.locator('#city').inputValue();
    expect(cityValue).toBe('London');

    const options = await page.locator('#frequency option').count();
    expect(options).toBe(2);

    await page.locator('#frequency').selectOption('hourly');
    const frequencyValue = await page.locator('#frequency').inputValue();
    expect(frequencyValue).toBe('hourly');

    expect(sendEmailSpy).not.toHaveBeenCalled();
    await expectNoSubscriptions();
  });

  it.each(['daily', 'hourly'])('submits form and handles successful response with %s frequency', async (frequency) => {
    await page.goto(BASE_URL);

    await page.locator('#email').fill('test@example.com');
    await page.locator('#city').fill('London');
    await page.locator('#frequency').selectOption(frequency);

    const responsePromise = page.waitForResponse((response) => response.url().includes('/api/subscribe'));

    await page.locator('button[type="submit"]').click();

    const response = await responsePromise;
    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    expect(responseBody).toEqual({
      message: 'Subscription successful. Confirmation email sent.',
    });

    expect(sendEmailSpy).toHaveBeenCalledTimes(1);

    expect(sendEmailSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['test@example.com'],
        subject: 'Confirm your weather subscription for London',
        from: `${configService.get('EMAIL_NAME')} <${configService.get('EMAIL_FROM')}>`,
        html: expect.stringMatching(/http:\/\/localhost:\d+\/api\/confirm\/.+?/),
        text: expect.stringMatching(/http:\/\/localhost:\d+\/api\/confirm\/.+?/),
      }),
    );

    await expectNoSubscriptions();
  });

  it.each(['daily', 'hourly'])(
    'does not send email when invalid city is provided with %s frequency',
    async (frequency) => {
      await page.goto(BASE_URL);

      await page.locator('#email').fill('test@example.com');
      await page.locator('#city').fill('InvalidCity');
      await page.locator('#frequency').selectOption(frequency);

      const responsePromise = page.waitForResponse((response) => response.url().includes('/api/subscribe'));

      await page.locator('button[type="submit"]').click();

      const response = await responsePromise;
      expect(response.status()).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        message: 'City not found',
      });

      expect(sendEmailSpy).not.toHaveBeenCalled();
      await expectNoSubscriptions();
    },
  );

  it('validates required fields', async () => {
    await page.goto(BASE_URL);

    await page.locator('button[type="submit"]').click();

    expect(page.url()).toContain(BASE_URL.replace(/\/$/, ''));

    const emailValid = await page.evaluate(() => {
      const emailInput = document.getElementById('email') as HTMLInputElement;
      return emailInput.validity.valid;
    });
    expect(emailValid).toBe(false);

    expect(sendEmailSpy).not.toHaveBeenCalled();
    await expectNoSubscriptions();
  });
});
