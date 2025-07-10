import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { WeatherService } from './services/weather.service.js';
import { MetricsService } from './services/metrics.service.js';

export class Server {
  private weatherService: WeatherService;
  private metricsService: MetricsService;
  private app = new Hono();

  constructor({ weatherService, metricsService }: { weatherService: WeatherService; metricsService: MetricsService }) {
    this.weatherService = weatherService;
    this.metricsService = metricsService;
    this.setup();
  }

  private setup() {
    this.app.get('/weather', async (c) => {
      const city = c.req.query('city');
      if (!city) return c.json({ error: 'city is required' }, 400);
      const weather = await this.weatherService.getWeather(city);
      return c.json({ weather });
    });

    this.app.get('/weather/validate', async (c) => {
      const city = c.req.query('city');
      if (!city) return c.json({ error: 'city is required' }, 400);
      const isValid = await this.weatherService.validateCity(city);
      return c.json({ isValid });
    });

    this.app.get('/metrics', async (c) => {
      const { metrics, contentType } = await this.metricsService.collectMetrics();
      c.header('Content-Type', contentType);
      return c.body(metrics);
    });
  }

  public async listen(port: number) {
    serve({ fetch: this.app.fetch, port });
  }

  public async close() {
    // No direct close for hono/node-server, but you can add logic if needed
  }
}
