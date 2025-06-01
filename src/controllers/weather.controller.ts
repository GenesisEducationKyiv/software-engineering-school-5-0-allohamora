import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import { getWeather } from 'src/services/weather.service.js';

export const makeWeatherRoutes = (app: OpenAPIHono) => {
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
    async (c) => {
      const { city } = c.req.valid('query');

      const weather = await getWeather(city);

      return c.json(weather);
    },
  );
};
