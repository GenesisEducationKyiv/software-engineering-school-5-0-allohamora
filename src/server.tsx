import { secureHeaders } from 'hono/secure-headers';
import { HTTPException } from 'hono/http-exception';
import { serveStatic } from '@hono/node-server/serve-static';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { makeSubscriptionRoutes } from './controllers/subscription.controller.js';
import { makeWeatherRoutes } from './controllers/weather.controller.js';
import { Root } from './root.js';
import { WeatherService } from './services/weather.service.js';
import { SubscriptionService } from './services/subscription.service.js';
import { serve, ServerType } from '@hono/node-server';
import { AddressInfo } from 'node:net';

export interface Server {
  serve(callback: (info: AddressInfo, server: ServerType) => Promise<void>, port: number): void;
  request(input: RequestInfo | URL, requestInit?: RequestInit): Promise<Response>;
}

export class HonoServer implements Server {
  constructor(
    private weatherService: WeatherService,
    private subscriptionService: SubscriptionService,
    private httpServer = new OpenAPIHono(),
  ) {
    this.setup();
  }

  private setup() {
    this.httpServer.use(secureHeaders());

    this.httpServer.onError((err, c) => {
      const message = err instanceof HTTPException ? err.message : 'internal server error';
      const statusCode = err instanceof HTTPException ? err.status : 500;

      return c.json({ message }, statusCode);
    });

    // if you specify the 200 schema as a string, you cannot be able to use c.html because of type issues
    this.httpServer.openapi(
      createRoute({ method: 'get', path: '/', responses: { 200: { description: 'the root page' } } }),
      async (c) => await c.html(<Root />),
    );

    this.httpServer.doc('/swagger.json', {
      openapi: '3.0.0',
      info: {
        version: '0.0.1',
        title: 'weather subscription',
      },
    });
    this.httpServer.get('/swagger', swaggerUI({ url: '/swagger.json' }));

    const apiRouter = new OpenAPIHono();
    makeWeatherRoutes(apiRouter, this.weatherService);
    makeSubscriptionRoutes(apiRouter, this.subscriptionService);

    this.httpServer.route('/api', apiRouter);

    this.httpServer.get('*', serveStatic({ root: './public' }));
  }

  public serve(callback: (info: AddressInfo, server: ServerType) => Promise<void>, port: number) {
    const server = serve({ fetch: this.httpServer.fetch, port }, async (info) => {
      await callback(info, server);
    });
  }

  public async request(input: RequestInfo | URL, requestInit?: RequestInit) {
    return await this.httpServer.request(input, requestInit);
  }
};

