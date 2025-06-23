import '../mocks/config.mock.js';
import { ServerType } from '@hono/node-server';
import { Db, DbService } from 'src/services/db.service.js';
import { Browser, chromium, Page } from 'playwright';
import { Server } from 'src/server.js';
import { http, HttpResponse, JsonBodyType } from 'msw';
import { createContainer } from 'src/container.js';
import { Frequency } from 'src/db.schema.js';
import { createMockServer } from '__tests__/utils/mock-server.utils.js';

describe('Root Page E2E Tests', () => {
  let BASE_URL: string;

  let browser: Browser;
  let page: Page;

  let dbService: DbService;
  let db: Db;
  let server: Server;
  let httpServer: ServerType;

  const form = {
    submitButton: () => {
      return page.locator('button[type="submit"]');
    },
    submit: async () => {
      return await form.submitButton().click();
    },
    email: () => {
      return page.locator('#email');
    },
    city: () => {
      return page.locator('#city');
    },
    frequency: () => {
      return page.locator('#frequency');
    },
  };

  const mockServer = createMockServer();

  const weatherApi = {
    mock: (fn: (city: string | null) => HttpResponse<JsonBodyType>) => {
      return http.get('https://api.weatherapi.com/v1/current.json', ({ request }) => {
        const url = new URL(request.url);
        const city = url.searchParams.get('q');

        return fn(city);
      });
    },
    notFound: () =>
      weatherApi.mock(() =>
        HttpResponse.json(
          {
            error: {
              code: 1006,
              message: 'No matching location found.',
            },
          },
          { status: 400 },
        ),
      ),
    internalServerError: () =>
      weatherApi.mock(() =>
        HttpResponse.json(
          {
            error: {
              code: 500,
              message: 'Internal Server Error',
            },
          },
          { status: 500 },
        ),
      ),
    ok: () =>
      weatherApi.mock((city) =>
        HttpResponse.json({
          location: {
            name: city,
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
        }),
      ),
  };

  const geocodingApi = {
    mock: (fn: (city: string | null) => HttpResponse<JsonBodyType>) => {
      return http.get('https://geocoding-api.open-meteo.com/v1/search', ({ request }) => {
        const url = new URL(request.url);
        const city = url.searchParams.get('name');

        return fn(city);
      });
    },
    notFound: () =>
      geocodingApi.mock(() =>
        HttpResponse.json(
          {
            generationtime_ms: 0.6712675,
          },
          { status: 400 },
        ),
      ),
    ok: () =>
      geocodingApi.mock((city) =>
        HttpResponse.json({
          results: [
            {
              id: 2643743,
              name: city,
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
        }),
      ),
  };

  const forecastApi = {
    mock: (fn: (latitude: string | null, longitude: string | null) => HttpResponse<JsonBodyType>) => {
      return http.get('https://api.open-meteo.com/v1/forecast', ({ request }) => {
        const url = new URL(request.url);
        const latitude = url.searchParams.get('latitude');
        const longitude = url.searchParams.get('longitude');

        return fn(latitude, longitude);
      });
    },
    ok: () =>
      forecastApi.mock((latitude, longitude) =>
        HttpResponse.json({
          latitude,
          longitude,
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
        }),
      ),
  };

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
  };

  beforeAll(async () => {
    mockServer.start();

    ({ dbService, server } = createContainer());

    db = dbService.getConnection();

    const { info, server: serverInstance } = await server.serve(0);

    BASE_URL = `http://localhost:${info.port}`;
    httpServer = serverInstance;

    await dbService.runMigrations();
    browser = await chromium.launch();
  });

  beforeEach(async () => {
    page = await browser.newPage();
  });

  afterEach(async () => {
    await dbService.clearDb();
    await page.close();

    // here is the solution used https://github.com/mswjs/msw/issues/946#issuecomment-1572768939
    expect(mockServer.onUnhandledRequest).not.toHaveBeenCalled();
    mockServer.onUnhandledRequest.mockClear();

    mockServer.clearHandlers();
  });

  afterAll(async () => {
    mockServer.stop();

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

    const subscriptions = await db.query.subscriptions.findMany();
    expect(subscriptions.length).toBe(0);
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

    const subscriptions = await db.query.subscriptions.findMany();
    expect(subscriptions.length).toBe(0);
  });

  it.each([Frequency.Daily, Frequency.Hourly])(
    'submits form and handles successful response with %s frequency',
    async (frequency) => {
      mockServer.addHandlers(weatherApi.ok(), emailApi.ok());

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

      const subscriptions = await db.query.subscriptions.findMany();
      expect(subscriptions.length).toBe(0);
    },
  );

  it.each([Frequency.Daily, Frequency.Hourly])(
    'does not send email when invalid city is provided with %s frequency',
    async (frequency) => {
      mockServer.addHandlers(weatherApi.notFound());

      await page.goto(BASE_URL);

      await form.email().fill('test@example.com');
      await form.city().fill('InvalidCity');
      await form.frequency().selectOption(frequency);

      const responsePromise = page.waitForResponse((response) => response.url().includes('/api/subscribe'));

      await form.submit();

      const response = await responsePromise;
      expect(response.status()).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        message: 'City not found',
      });

      const subscriptions = await db.query.subscriptions.findMany();
      expect(subscriptions.length).toBe(0);

      expect(mockServer.onUnhandledRequest).not.toHaveBeenCalled();
    },
  );

  it.each([Frequency.Daily, Frequency.Hourly])(
    'falls back to open-meteo when weather API fails for %s frequency',
    async (frequency) => {
      mockServer.addHandlers(weatherApi.internalServerError(), geocodingApi.ok(), forecastApi.ok(), emailApi.ok());

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

      const subscriptions = await db.query.subscriptions.findMany();
      expect(subscriptions.length).toBe(0);

      expect(mockServer.onUnhandledRequest).not.toHaveBeenCalled();
    },
  );

  it('validates required fields', async () => {
    await page.goto(BASE_URL);

    await form.submit();

    expect(page.url()).toContain(BASE_URL.replace(/\/$/, ''));

    const emailValid = await form.email().evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(emailValid).toBe(false);

    const subscriptions = await db.query.subscriptions.findMany();
    expect(subscriptions.length).toBe(0);
  });
});
