import { ConfigService } from 'src/services/config.service.js';
import { LoggerService } from '@weather-subscription/shared';
import { Server } from './server.js';
import { App } from './app.js';
// import { createChannel, createClient } from 'nice-grpc';
// import { SubscriptionServiceDefinition } from '@weather-subscription/proto/subscription';
// import { WeatherServiceDefinition } from '@weather-subscription/proto/weather';

export class Container {
  public configService = new ConfigService();
  public config = this.configService.getConfig();

  public loggerService = new LoggerService(this);

  public subscriptionClient = {
    subscribe: async (options: any) => {
      const res = await fetch(`${this.config.SUBSCRIPTION_SERVICE_URL}/subscription/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      return await res.json();
    },
    confirm: async ({ token }: { token?: string }) => {
      if (!token) throw new Error('token is required');
      const res = await fetch(`${this.config.SUBSCRIPTION_SERVICE_URL}/subscription/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      return await res.json();
    },
    unsubscribe: async ({ token }: { token?: string }) => {
      if (!token) throw new Error('token is required');
      const res = await fetch(`${this.config.SUBSCRIPTION_SERVICE_URL}/subscription/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      return await res.json();
    },
    handleSubscriptions: async ({ frequency }: { frequency?: string }) => {
      if (!frequency) throw new Error('frequency is required');
      await fetch(`${this.config.SUBSCRIPTION_SERVICE_URL}/subscription/handle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frequency }),
      });
    },
  };
  public weatherClient = {
    getWeather: async ({ city }: { city?: string }) => {
      if (!city) throw new Error('city is required');
      const res = await fetch(`${this.config.WEATHER_SERVICE_URL}/weather?city=${encodeURIComponent(city)}`);
      return { weather: await res.json() };
    },
    validateCity: async ({ city }: { city?: string }) => {
      if (!city) throw new Error('city is required');
      const res = await fetch(`${this.config.WEATHER_SERVICE_URL}/weather/validate?city=${encodeURIComponent(city)}`);
      return await res.json();
    },
    collectMetrics: async () => {
      const res = await fetch(`${this.config.WEATHER_SERVICE_URL}/metrics`);
      return { metrics: await res.text(), contentType: res.headers.get('content-type') || 'text/plain' };
    },
  };

  public server = new Server(this);

  public app = new App(this);
}
