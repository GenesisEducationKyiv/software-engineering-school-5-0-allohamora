import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { EmailService } from './services/email.service.js';

export class Server {
  private emailService: EmailService;
  private app = new Hono();

  constructor({ emailService }: { emailService: EmailService }) {
    this.emailService = emailService;
    this.setup();
  }

  private setup() {
    this.app.post('/email/subscribe', async (c) => {
      const options = await c.req.json();
      await this.emailService.sendSubscribeEmail(options);
      return c.json({});
    });

    this.app.post('/email/weather-update', async (c) => {
      const options = await c.req.json();
      await this.emailService.sendWeatherUpdateEmail(options);
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
