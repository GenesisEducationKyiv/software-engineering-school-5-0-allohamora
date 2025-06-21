import '../mocks/config.mock.js';
import { ServerType } from '@hono/node-server';
import { Db, DbService } from 'src/services/db.service.js';
import { Browser, chromium, Page } from 'playwright';
import { Server } from 'src/server.js';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { makeDeps } from 'src/deps.js';
import { ConfigService } from 'src/services/config.service.js';
import { Frequency } from 'src/db.schema.js';

describe('Root Page E2E Tests', () => {
  let BASE_URL: string;

  let browser: Browser;
  let page: Page;

  let configService: ConfigService;
  let dbService: DbService;
  let db: Db;
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
    http.get('https://geocoding-api.open-meteo.com/v1/search', ({ request }) => {
      const url = new URL(request.url);
      const city = url.searchParams.get('name');

      if (city !== 'London') {
        return HttpResponse.json(
          {
            generationtime_ms: 0.6712675,
          },
          { status: 400 },
        );
      }

      return HttpResponse.json({
        results: [
          {
            id: 2643743,
            name: 'London',
            latitude: 51.5074,
            longitude: -0.1278,
            elevation: 35,
            feature_code: 'PPLC',
            country_code: 'GB',
            admin1_id: 2643743,
            admin2_id: 2643743,
            timezone: 'Europe/London',
            population: 8982000,
            country_id: 2643743,
            country: 'United Kingdom',
            admin1: 'England',
            admin2: 'Greater London',
          },
        ],
      });
    }),
    http.get('https://api.open-meteo.com/v1/forecast', ({ request }) => {
      const url = new URL(request.url);
      const city = url.searchParams.get('latitude') && url.searchParams.get('longitude');

      if (!city) {
        return HttpResponse.text('Validation error: latitude and longitude are required', { status: 400 });
      }

      return HttpResponse.json({
        latitude: 51.5074,
        longitude: -0.1278,
        generationtime_ms: 0.6712675,
        utc_offset_seconds: 3600,
        timezone: 'Europe/London',
        timezone_abbreviation: 'BST',
        elevation: 35,
        current_weather: {
          temperature: 20.0,
          windspeed: 5.0,
          winddirection: 180,
          weathercode: 1,
          is_day: 1,
          time: '2025-05-13T16:00:00Z',
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

  it.each([Frequency.Daily, Frequency.Hourly])(
    'submits form and handles successful response with %s frequency',
    async (frequency) => {
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
    },
  );

  it.each([Frequency.Daily, Frequency.Hourly])(
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

  it.each([Frequency.Daily, Frequency.Hourly])(
    'falls back to open-meteo when weather API fails for %s frequency',
    async (frequency) => {
      mswServer.use(
        http.get('https://api.weatherapi.com/v1/current.json', () => {
          return HttpResponse.json({ error: { code: 500, message: 'Internal Server Error' } }, { status: 500 });
        }),
      );

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
