import { secureHeaders } from 'hono/secure-headers';
import { serveStatic } from '@hono/node-server/serve-static';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { SubscriptionRouter } from './routers/subscription.router.js';
import { WeatherRouter } from './routers/weather.router.js';
import { UiRouter } from './routers/ui.router.js';
import { serve, ServerType } from '@hono/node-server';
import { Exception, HttpStatus } from '@weather-subscription/shared';
import { AddressInfo } from 'node:net';
import { HttpMetricsService } from './services/http-metrics.service.js';

export type ServerInfo = {
  info: AddressInfo;
  server: ServerType;
};

type Dependencies = {
  httpMetricsService: HttpMetricsService;
  weatherRouter: WeatherRouter;
  subscriptionRouter: SubscriptionRouter;
  uiRouter: UiRouter;
};

export class Server {
  private httpMetricsService: HttpMetricsService;

  private weatherRouter: WeatherRouter;
  private subscriptionRouter: SubscriptionRouter;
  private uiRouter: UiRouter;

  private app = new OpenAPIHono();

  constructor({ httpMetricsService, weatherRouter, subscriptionRouter, uiRouter }: Dependencies) {
    this.httpMetricsService = httpMetricsService;

    this.weatherRouter = weatherRouter;
    this.subscriptionRouter = subscriptionRouter;
    this.uiRouter = uiRouter;

    this.setup();
  }

  private setup() {
    this.app.use(secureHeaders());

    this.app.use(async (c, next) => {
      const { method, routePath: path } = c.req;

      this.httpMetricsService.increaseRequestCount({ method, path });
      const endTimer = this.httpMetricsService.startResponseDurationTimer({ method, path });

      await next();

      endTimer();
    });

    this.app.onError((err, c) => {
      const { method, routePath: path } = c.req;

      const message = err instanceof Exception ? err.message : 'internal server error';
      const statusCode = err instanceof Exception ? err.getHttpCode() : HttpStatus.INTERNAL_SERVER_ERROR;

      this.httpMetricsService.increaseErrorCount({ method, path, message, statusCode });

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
