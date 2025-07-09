import {  Client } from 'nice-grpc';
import { Exception, ExceptionCode } from './exception.js';
import { secureHeaders } from 'hono/secure-headers';
import { serveStatic } from '@hono/node-server/serve-static';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { makeSubscriptionRoutes } from './controllers/subscription.controller.js';
import { makeWeatherRoutes } from './controllers/weather.controller.js';
import { serve, ServerType } from '@hono/node-server';
import { makeUiRoutes } from './controllers/ui.controller.js';
import { LoggerService } from './services/logger.service.js';
import { WeatherServiceDefinition } from 'libs/proto/dist/weather.js';
import { SubscriptionServiceDefinition } from 'libs/proto/dist/subscription.js';
import { HttpStatus } from './types/http.types.js';
import { AddressInfo } from 'node:net';
import { makeMetricsRoutes } from './controllers/metrics.controller.js';

export type ServerInfo = {
  info: AddressInfo;
  server: ServerType;
}

type Options = {
  weatherClient: Client<WeatherServiceDefinition>;
  subscriptionClient: Client<SubscriptionServiceDefinition>;
  loggerService: LoggerService;
};

export class Server {
  private weatherClient: Client<WeatherServiceDefinition>;
  private subscriptionClient: Client<SubscriptionServiceDefinition>;

  private app = new OpenAPIHono();

  constructor({
    weatherClient,
    subscriptionClient,
  }: Options) {
    this.weatherClient = weatherClient;
    this.subscriptionClient = subscriptionClient;

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
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
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
    makeWeatherRoutes(apiRouter, this.weatherClient);
    makeSubscriptionRoutes(apiRouter, this.subscriptionClient);
    makeMetricsRoutes(apiRouter, this.weatherClient);

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

