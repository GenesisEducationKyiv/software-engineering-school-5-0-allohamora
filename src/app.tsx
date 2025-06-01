import { secureHeaders } from 'hono/secure-headers';
import { HTTPException } from 'hono/http-exception';
import { serveStatic } from '@hono/node-server/serve-static';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { makeSubscriptionRoutes } from './controllers/subscription.controller.js';
import { makeWeatherRoutes } from './controllers/weather.controller.js';
import { Root } from './root.js';

export const app = new OpenAPIHono();

app.use(secureHeaders());

app.onError((err, c) => {
  const message = err instanceof HTTPException ? err.message : 'internal server error';
  const statusCode = err instanceof HTTPException ? err.status : 500;

  return c.json({ message }, statusCode);
});

// if you specify the 200 schema as a string, you cannot be able to use c.html because of type issues
app.openapi(
  createRoute({ method: 'get', path: '/', responses: { 200: { description: 'the root page' } } }),
  async (c) => await c.html(<Root />),
);

app.doc('/swagger.json', {
  openapi: '3.0.0',
  info: {
    version: '0.0.1',
    title: 'weather subscription',
  },
});
app.get('/swagger', swaggerUI({ url: '/swagger.json' }));


const apiRouter = new OpenAPIHono();
makeWeatherRoutes(apiRouter);
makeSubscriptionRoutes(apiRouter);

app.route('/api', apiRouter);

app.get('*', serveStatic({ root: './public' }));
