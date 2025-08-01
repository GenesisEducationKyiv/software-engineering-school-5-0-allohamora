import { ConfigService } from 'src/services/config.service.js';
import { LoggerService } from '@weather-subscription/shared';
import { createChannel, createClient } from 'nice-grpc';
import { SubscriptionServiceDefinition } from '@weather-subscription/proto/subscription';
import { WeatherServiceDefinition } from '@weather-subscription/proto/weather';
import { SubscriptionRouter } from './routers/subscription.router.js';
import { UiRouter } from './routers/ui.router.js';
import { WeatherRouter } from './routers/weather.router.js';
import { Server } from './server.js';
import { App } from './app.js';

export class Container {
  public configService = new ConfigService();
  public config = this.configService.getConfig();

  public loggerService = new LoggerService(this);

  public subscriptionClient = createClient(
    SubscriptionServiceDefinition,
    createChannel(this.config.SUBSCRIPTION_SERVICE_URL),
  );
  public weatherClient = createClient(WeatherServiceDefinition, createChannel(this.config.WEATHER_SERVICE_URL));

  public subscriptionRouter = new SubscriptionRouter(this);
  public uiRouter = new UiRouter();
  public weatherRouter = new WeatherRouter(this);

  public server = new Server(this);

  public app = new App(this);
}
