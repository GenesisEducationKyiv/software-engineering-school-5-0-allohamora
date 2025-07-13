import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { RootView } from '../views/root.view.js';

export const makeUiRoutes = (app: OpenAPIHono) => {
  // if you specify the 200 schema as a string, you cannot be able to use c.html because of type issues
  app.openapi(
    createRoute({ method: 'get', path: '/', responses: { 200: { description: 'the root page' } } }),
    async (ctx) => await ctx.html(<RootView />),
  );
};
