import { secureHeaders } from 'hono/secure-headers';
import { HTTPException } from 'hono/http-exception';
import { serveStatic } from '@hono/node-server/serve-static';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { makeSubscriptionRoutes } from './controllers/subscription.controller.js';
import { makeWeatherRoutes } from './controllers/weather.controller.js';
import { Root } from './root.js';
import { SubscriptionService } from './services/subscription.service.js';
import { serve, ServerType } from '@hono/node-server';
import { AddressInfo } from 'node:net';
import { WeatherService } from './services/weather.service.js';
import { makeMetricsRoutes } from './controllers/metrics.controller.js';
import { MetricsService } from './services/metrics.service.js';

export type ServerInfo = {
  info: AddressInfo;
  server: ServerType;
}

type Options = {
  weatherService: WeatherService;
  subscriptionService: SubscriptionService;
  metricsService: MetricsService;
};

export class Server {
  private weatherService: WeatherService;
  private subscriptionService: SubscriptionService;
  private metricsService: MetricsService;

  private app = new OpenAPIHono();

  constructor({
    weatherService,
    subscriptionService,
    metricsService
  }: Options) {
    this.weatherService = weatherService;
    this.subscriptionService = subscriptionService;
    this.metricsService = metricsService;

    this.setup();
  }

  private setup() {
    this.app.use(secureHeaders());

    this.app.onError((err, c) => {
      const message = err instanceof HTTPException ? err.message : 'internal server error';
      const statusCode = err instanceof HTTPException ? err.status : 500;

      return c.json({ message }, statusCode);
    });

    // if you specify the 200 schema as a string, you cannot be able to use c.html because of type issues
    this.app.openapi(
      createRoute({ method: 'get', path: '/', responses: { 200: { description: 'the root page' } } }),
      async (ctx) => await ctx.html(<Root />),
    );

    this.app.doc('/swagger.json', {
      openapi: '3.0.0',
      info: {
        version: '0.0.1',
        title: 'weather subscription',
      },
    });
    this.app.get('/swagger', swaggerUI({ url: '/swagger.json' }));

    const apiRouter = new OpenAPIHono();
    makeWeatherRoutes(apiRouter, this.weatherService);
    makeSubscriptionRoutes(apiRouter, this.subscriptionService);
    makeMetricsRoutes(apiRouter, this.metricsService);

    this.app.route('/api', apiRouter);

    this.app.get('*', serveStatic({ root: './public' }));
  }

  public async serve(port: number) {
    const { resolve, promise } = Promise.withResolvers<ServerInfo>();

    const server = serve({ fetch: this.app.fetch, port }, async (info) => {
      resolve({ info, server });
    });

    return await promise;
  }

  public async request(input: RequestInfo | URL, requestInit?: RequestInit) {
    return await this.app.request(input, requestInit);
  }
};

