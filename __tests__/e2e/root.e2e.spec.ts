import '../mocks/config.mock.js';
import { ServerType } from '@hono/node-server';
import { Db, DbService } from 'src/services/db.service.js';
import { Browser, chromium, Page } from 'playwright';
import { Server } from 'src/server.js';
import { http, HttpResponse, JsonBodyType } from 'msw';
import { createContainer } from 'src/container.js';
import { Frequency } from 'src/db.schema.js';
import { createMockServer } from '__tests__/utils/mock-server.utils.js';
import { Chance } from 'chance';

describe('Root Page E2E Tests', () => {
  let BASE_URL: string;

  let browser: Browser;
  let page: Page;

  let dbService: DbService;
  let db: Db;
  let server: Server;
  let httpServer: ServerType;

  const chance = new Chance();

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
            region: chance.state({ full: true }),
            country: chance.country({ full: true }),
            lat: chance.latitude(),
            lon: chance.longitude(),
            tz_id: chance.timezone().name,
            localtime_epoch: chance.timestamp(),
            localtime: chance.date({ string: true, american: false }),
          },
          current: {
            last_updated_epoch: chance.timestamp(),
            last_updated: chance.date({ string: true, american: false }),
            temp_c: chance.floating({ min: -10, max: 40, fixed: 1 }),
            temp_f: chance.floating({ min: 14, max: 104, fixed: 1 }),
            is_day: chance.integer({ min: 0, max: 1 }),
            condition: {
              text: chance.pickone(['Sunny', 'Cloudy', 'Partly cloudy', 'Overcast', 'Mist', 'Patchy rain possible']),
              icon: `//cdn.weatherapi.com/weather/64x64/day/${chance.integer({ min: 100, max: 399 })}.png`,
              code: chance.integer({ min: 1000, max: 1300 }),
            },
            wind_mph: chance.floating({ min: 0, max: 30, fixed: 1 }),
            wind_kph: chance.floating({ min: 0, max: 48, fixed: 1 }),
            wind_degree: chance.integer({ min: 0, max: 360 }),
            wind_dir: chance.pickone(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']),
            pressure_mb: chance.floating({ min: 980, max: 1040, fixed: 1 }),
            pressure_in: chance.floating({ min: 28.9, max: 30.7, fixed: 2 }),
            precip_mm: chance.floating({ min: 0, max: 10, fixed: 1 }),
            precip_in: chance.floating({ min: 0, max: 0.4, fixed: 2 }),
            humidity: chance.integer({ min: 30, max: 90 }),
            cloud: chance.integer({ min: 0, max: 100 }),
            feelslike_c: chance.floating({ min: -10, max: 40, fixed: 1 }),
            feelslike_f: chance.floating({ min: 14, max: 104, fixed: 1 }),
            vis_km: chance.floating({ min: 5, max: 20, fixed: 1 }),
            vis_miles: chance.floating({ min: 3, max: 12, fixed: 1 }),
            uv: chance.floating({ min: 0, max: 10, fixed: 1 }),
            gust_mph: chance.floating({ min: 0, max: 40, fixed: 1 }),
            gust_kph: chance.floating({ min: 0, max: 64, fixed: 1 }),
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
            generationtime_ms: chance.floating({ min: 0.1, max: 2.0, fixed: 7 }),
          },
          { status: 400 },
        ),
      ),
    ok: () =>
      geocodingApi.mock((city) =>
        HttpResponse.json({
          results: [
            {
              id: chance.integer({ min: 1000000, max: 9999999 }),
              name: city,
              latitude: chance.latitude(),
              longitude: chance.longitude(),
              elevation: chance.integer({ min: 0, max: 500 }),
              feature_code: chance.pickone(['PPLC', 'PPL', 'PPLA', 'PPLA2']),
              country_code: chance.country({ full: false }),
              admin1_id: chance.integer({ min: 1000000, max: 9999999 }),
              admin2_id: chance.integer({ min: 1000000, max: 9999999 }),
              timezone: chance.timezone().name,
              population: chance.integer({ min: 100000, max: 10000000 }),
              country_id: chance.integer({ min: 1000000, max: 9999999 }),
              country: chance.country({ full: true }),
              admin1: chance.state({ full: true }),
              admin2: chance.city(),
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
          generationtime_ms: chance.floating({ min: 0.1, max: 2.0, fixed: 7 }),
          utc_offset_seconds: chance.integer({ min: -43200, max: 43200 }),
          timezone: chance.timezone().name,
          timezone_abbreviation: chance.pickone(['UTC', 'GMT', 'EST', 'PST', 'CET', 'JST']),
          elevation: chance.integer({ min: 0, max: 500 }),
          current_weather: {
            temperature: chance.floating({ min: -10, max: 40, fixed: 1 }),
            windspeed: chance.floating({ min: 0, max: 25, fixed: 1 }),
            winddirection: chance.integer({ min: 0, max: 360 }),
            weathercode: chance.integer({ min: 0, max: 99 }),
            is_day: chance.integer({ min: 0, max: 1 }),
            time: chance.date({ string: true }),
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
          id: chance.guid(),
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
