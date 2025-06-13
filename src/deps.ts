import { CronerCronService, CronService } from './services/cron.service.js';
import { DrizzleSubscriptionRepository, SubscriptionRepository } from './repositories/subscription.repository.js';
import { FastJwtService, JwtService } from './services/jwt.service.js';
import { ApiWeatherService, WeatherService } from './services/weather.service.js';
import { SubscriptionService, WeatherSubscriptionService } from './services/subscription.service.js';
import { Server, HonoServer } from './server.js';
import { App, CronServerApp } from './app.js';

export const makeDeps = () => {
  const subscriptionRepository: SubscriptionRepository = new DrizzleSubscriptionRepository();
  const jwtService: JwtService = new FastJwtService();
  const weatherService: WeatherService = new ApiWeatherService();
  const subscriptionService: SubscriptionService = new WeatherSubscriptionService(
    jwtService,
    subscriptionRepository,
    weatherService,
  );
  const cronService: CronService = new CronerCronService(subscriptionService);

  const server: Server = new HonoServer(weatherService, subscriptionService);
  const app: App = new CronServerApp(server, cronService);

  return {
    app,
    server,
    cronService,
    subscriptionService,
    weatherService,
    jwtService,
    subscriptionRepository,
  };
};
