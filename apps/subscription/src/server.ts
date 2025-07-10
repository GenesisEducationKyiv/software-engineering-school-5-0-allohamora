import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { SubscriptionService } from './services/subscription.service.js';

export class Server {
  private subscriptionService: SubscriptionService;
  private app = new Hono();

  constructor({ subscriptionService }: { subscriptionService: SubscriptionService }) {
    this.subscriptionService = subscriptionService;
    this.setup();
  }

  private setup() {
    this.app.post('/subscription/subscribe', async (c) => {
      const options = await c.req.json();
      await this.subscriptionService.subscribe(options);
      return c.json({ message: 'Subscription successful. Confirmation email sent.' });
    });

    this.app.post('/subscription/confirm', async (c) => {
      const { token } = await c.req.json();
      await this.subscriptionService.confirm(token);
      return c.json({ message: 'Subscription confirmed successfully' });
    });

    this.app.post('/subscription/unsubscribe', async (c) => {
      const { token } = await c.req.json();
      await this.subscriptionService.unsubscribe(token);
      return c.json({ message: 'Unsubscribed successfully' });
    });

    this.app.post('/subscription/handle', async (c) => {
      const { frequency } = await c.req.json();
      await this.subscriptionService.handleSubscriptions(frequency);
      return c.json({});
    });
  }

  public async listen(port: number) {
    serve({ fetch: this.app.fetch, port });
  }

  public async close() {
    // No direct close for hono/node-server, but you can add logic if needed
  }
}
