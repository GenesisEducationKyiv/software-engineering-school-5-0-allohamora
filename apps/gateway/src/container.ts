import { ConfigService } from 'src/services/config.service.js';
import { LoggerService } from '@weather-subscription/shared';
import { Server } from './server.js';
import { App } from './app.js';
import { createChannel, createClient } from 'nice-grpc';
import { SubscriptionServiceDefinition } from '@weather-subscription/proto/subscription';
import { WeatherServiceDefinition } from '@weather-subscription/proto/weather';

export class Container {
  public configService = new ConfigService();
  public config = this.configService.getConfig();

  public loggerService = new LoggerService(this);

  public subscriptionClient = createClient(SubscriptionServiceDefinition, createChannel(this.config.SUBSCRIPTION_SERVICE_URL));
  public weatherClient = createClient(WeatherServiceDefinition, createChannel(this.config.WEATHER_SERVICE_URL));

  public server = new Server(this);

  public app = new App(this);
}
