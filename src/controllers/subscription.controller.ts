import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import { subscribe, confirm, unsubscribe } from 'src/services/subscription.service.js';
import { Frequency } from 'src/db.schema.js';
import { Exception, ExceptionCode } from 'src/exception.js';

export const makeSubscriptionRoutes = (app: OpenAPIHono) => {
  const subscribeSchema = z.object({
    email: z.string().email().describe('Email address to subscribe'),
    city: z.string().min(1).describe('City for weather updates'),
    frequency: z.enum([Frequency.Hourly, Frequency.Daily]).describe('Frequency of updates (hourly or daily)'),
  });

  app.openapi(
    createRoute({
      method: 'post',
      path: '/subscribe',
      tags: ['subscription'],
      summary: 'Subscribe to weather updates',
      description: 'Subscribe an email to receive weather updates for a specific city with chosen frequency.',
      request: {
        body: {
          content: {
            'application/json': {
              schema: subscribeSchema,
            },
            'application/x-www-form-urlencoded': {
              schema: subscribeSchema,
            },
          },
        },
      },
      responses: {
        // in the contract 200 instead of 201
        200: {
          description: 'Subscription successful. Confirmation email sent.',
        },
        400: {
          description: 'Invalid input',
        },
        409: {
          description: 'Email already subscribed',
        },
        // we don't have in the contract, but we can have it in the code
        500: {
          description: 'Internal server error',
        },
      },
    }),
    async (c) => {
      // we have this function here, to preserve type safety
      const getSubscribeBody = () => {
        const contentType = c.req.header('content-type') || '';

        if (contentType.includes('application/json')) {
          return c.req.valid('json');
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          return c.req.valid('form');
        } else {
          throw new Exception(ExceptionCode.VALIDATION_ERROR, 'Unsupported content type');
        }
      };

      const options = getSubscribeBody();
      await subscribe(options);

      return c.json({ message: 'Subscription successful. Confirmation email sent.' }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: 'get',
      path: '/confirm/{token}',
      tags: ['subscription'],
      summary: 'Confirm email subscription',
      description: 'Confirms a subscription using the token sent in the confirmation email.',
      request: {
        params: z.object({
          token: z.string().jwt().describe('Confirmation token'),
        }),
      },
      responses: {
        200: {
          description: 'Subscription confirmed successfully',
        },
        400: {
          description: 'Invalid token',
        },
        // to preserve the contract
        // but in the current implementation
        // we use jwt instead of the temporary token
        // or inactive subscription
        // then we just don't have this exception
        404: {
          description: 'Token not found',
        },
      },
    }),
    async (c) => {
      const { token } = c.req.param();

      await confirm(token);

      return c.json({ message: 'Subscription confirmed successfully' }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: 'get',
      path: '/unsubscribe/{token}',
      tags: ['subscription'],
      summary: 'Unsubscribe from weather updates',
      description: 'Unsubscribes an email from weather updates using the token sent in emails.',
      request: {
        params: z.object({
          token: z.string().uuid().describe('Unsubscribe token'),
        }),
      },
      responses: {
        200: {
          description: 'Unsubscribed successfully',
        },
        400: {
          description: 'Invalid token',
        },
        // to preserve the contract
        // but in the current implementation
        // we just remove the subscription by id
        // to check that it exits we need to do an additional request
        // what is unnecessary
        404: {
          description: 'Token not found',
        },
      },
    }),
    async (c) => {
      const { token } = c.req.param();

      await unsubscribe(token);

      return c.json({ message: 'Unsubscribed successfully' }, 200);
    },
  );
};
