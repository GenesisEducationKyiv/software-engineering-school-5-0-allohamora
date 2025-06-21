import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { WeatherProvider } from 'src/providers/weather/weather.provider.js';
import { z } from 'zod';

export const makeWeatherRoutes = (app: OpenAPIHono, weatherProvider: WeatherProvider) => {
  app.openapi(
    createRoute({
      method: 'get',
      path: '/weather',
      tags: ['weather'],
      summary: 'Get current weather for a city',
      description: 'Returns the current weather forecast for the specified city using WeatherAPI.com.',
      request: {
        query: z.object({
          city: z.string().min(1).describe('City name for weather forecast'),
        }),
      },
      responses: {
        200: {
          description: 'Successful operation - current weather forecast returned',
          content: {
            'application/json': {
              schema: z.object({
                temperature: z.number().describe('Current temperature'),
                humidity: z.number().describe('Current humidity percentage'),
                description: z.string().describe('Weather description'),
              }),
            },
          },
        },
        400: {
          description: 'Invalid request',
        },
        404: {
          description: 'City not found',
        },
      },
    }),
    async (ctx) => {
      const { city } = ctx.req.valid('query');

      const weather = await weatherProvider.getWeather(city);

      return ctx.json(weather);
    },
  );
};
