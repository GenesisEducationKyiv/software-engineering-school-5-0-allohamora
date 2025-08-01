import { secureHeaders } from 'hono/secure-headers';
import { serveStatic } from '@hono/node-server/serve-static';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { SubscriptionRouter } from './routers/subscription.router.js';
import { WeatherRouter } from './routers/weather.router.js';
import { UiRouter } from './routers/ui.router.js';
import { serve, ServerType } from '@hono/node-server';
import { Counter, Exception, Histogram, HttpStatus, MetricsService } from '@weather-subscription/shared';
import { AddressInfo } from 'node:net';

export type ServerInfo = {
  info: AddressInfo;
  server: ServerType;
};

type Dependencies = {
  metricsService: MetricsService;
  weatherRouter: WeatherRouter;
  subscriptionRouter: SubscriptionRouter;
  uiRouter: UiRouter;
};

export class Server {
  private requestCounter: Counter;
  private errorCounter: Counter;
  private responseTimeHistogram: Histogram;

  private weatherRouter: WeatherRouter;
  private subscriptionRouter: SubscriptionRouter;
  private uiRouter: UiRouter;

  private app = new OpenAPIHono();

  constructor({ metricsService, weatherRouter, subscriptionRouter, uiRouter }: Dependencies) {
    this.requestCounter = metricsService.createCounter({
      name: 'gateway_requests_total',
      help: 'Total number of requests to the gateway',
      labelNames: ['method', 'path'],
    });

    this.errorCounter = metricsService.createCounter({
      name: 'gateway_errors_total',
      help: 'Total number of errors in the gateway',
      labelNames: ['method', 'path', 'message', 'statusCode'],
    });

    this.responseTimeHistogram = metricsService.createHistogram({
      name: 'gateway_response_time_seconds',
      help: 'Response time of the gateway in seconds',
      labelNames: ['method', 'path'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    });

    this.weatherRouter = weatherRouter;
    this.subscriptionRouter = subscriptionRouter;
    this.uiRouter = uiRouter;

    this.setup();
  }

  private setup() {
    this.app.use(secureHeaders());

    this.app.use(async (c, next) => {
      this.requestCounter.inc({ method: c.req.method, path: c.req.routePath });
      const endTimer = this.responseTimeHistogram.startTimer({ method: c.req.method, path: c.req.routePath });

      await next();

      endTimer();
    });

    this.app.onError((err, c) => {
      const message = err instanceof Exception ? err.message : 'internal server error';
      const statusCode = err instanceof Exception ? err.getHttpCode() : HttpStatus.INTERNAL_SERVER_ERROR;

      this.errorCounter.inc({ method: c.req.method, path: c.req.routePath, message, statusCode });

      return c.json({ message }, statusCode);
    });

    this.uiRouter.setup(this.app);

    this.app.doc('/swagger.json', {
      openapi: '3.0.0',
      info: {
        version: '0.0.1',
        title: 'weather subscription',
      },
    });
    this.app.get('/swagger', swaggerUI({ url: '/swagger.json' }));

    const apiRouter = new OpenAPIHono();
    this.weatherRouter.setup(apiRouter);
    this.subscriptionRouter.setup(apiRouter);

    this.app.route('/api', apiRouter);

    this.app.get('*', serveStatic({ root: './public' }));
  }

  public async serve(port: number) {
    const { resolve, promise } = Promise.withResolvers<ServerInfo>();

    const server = serve({ fetch: this.app.fetch, port }, (info) => {
      resolve({ info, server });
    });

    return await promise;
  }

  public async request(input: RequestInfo | URL, requestInit?: RequestInit) {
    return await this.app.request(input, requestInit);
  }
}
