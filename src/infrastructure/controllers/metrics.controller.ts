import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { MetricsProvider } from '../adapters/metrics.provider.js';
import { z } from 'zod';

export const makeMetricsRoutes = (app: OpenAPIHono, metricsProvider: MetricsProvider) => {
  app.openapi(
    createRoute({
      method: 'get',
      path: '/metrics',
      tags: ['metrics'],
      summary: 'Get application metrics',
      description: 'Returns Prometheus-formatted metrics for monitoring and observability.',
      responses: {
        200: {
          description: 'Successful operation - metrics returned in Prometheus format',
          content: {
            'text/plain': {
              schema: z.string().describe('Prometheus-formatted metrics'),
            },
          },
        },
        500: {
          description: 'Internal server error',
        },
      },
    }),
    async (ctx) => {
      const metrics = await metricsProvider.getMetrics();

      ctx.header('Content-Type', metricsProvider.getMetricsContentType());

      return ctx.body(metrics);
    },
  );
};
