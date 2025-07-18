import { secureHeaders } from 'hono/secure-headers';
import { serveStatic } from '@hono/node-server/serve-static';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { makeSubscriptionRoutes } from '../controllers/subscription.controller.js';
import { makeWeatherRoutes } from '../controllers/weather.controller.js';
import { serve, ServerType } from '@hono/node-server';
import { AddressInfo } from 'node:net';
import { makeMetricsRoutes } from '../controllers/metrics.controller.js';
import { MetricsProvider } from 'src/secondary/adapters/metrics.provider.js';
import { Exception, ExceptionCode } from 'src/domain/entities/exception.entity.js';
import { HttpStatus } from 'src/primary/types/http.types.js';
import { makeUiRoutes } from '../controllers/ui.controller.js';
import { WeatherService } from 'src/domain/ports/primary/weather.service.js';
import { SubscriptionService } from 'src/domain/ports/primary/subscription.service.js';

export type ServerInfo = {
  info: AddressInfo;
  server: ServerType;
}

type Dependencies = {
  weatherService: WeatherService;
  subscriptionService: SubscriptionService;
  metricsProvider: MetricsProvider;
};

export class Server {
  private weatherService: WeatherService;
  private subscriptionService: SubscriptionService;
  private metricsProvider: MetricsProvider;

  private app = new OpenAPIHono();

  constructor({
    weatherService,
    subscriptionService,
    metricsProvider
  }: Dependencies) {
    this.weatherService = weatherService;
    this.subscriptionService = subscriptionService;
    this.metricsProvider = metricsProvider;

    this.setup();
  }

  private toHttpCode(code: ExceptionCode) {
    switch (code) {
      case ExceptionCode.NOT_FOUND:
        return HttpStatus.NOT_FOUND;
      case ExceptionCode.VALIDATION_ERROR:
        return HttpStatus.BAD_REQUEST;
      case ExceptionCode.ALREADY_EXISTS:
        return HttpStatus.CONFLICT;
      case ExceptionCode.INTERNAL_SERVER_ERROR:
        return HttpStatus.INTERNAL_SERVER_ERROR;
      default: {
        const exhaustiveCheck: never = code; // Type error if 'code' is not 'never'
        throw Exception.InternalServerError(`Unknown exception code: ${exhaustiveCheck}`);
      }
    }
  };

  private setup() {
    this.app.use(secureHeaders());

    this.app.onError((err, c) => {
      const message = err instanceof Exception ? err.message : 'internal server error';
      const statusCode = err instanceof Exception ? this.toHttpCode(err.code) : HttpStatus.INTERNAL_SERVER_ERROR;

      return c.json({ message }, statusCode);
    });

    makeUiRoutes(this.app);

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
    makeMetricsRoutes(apiRouter, this.metricsProvider);

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

