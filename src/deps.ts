import { CronerCronService, CronService } from './services/cron.service.js';
import { DrizzleSubscriptionRepository, SubscriptionRepository } from './repositories/subscription.repository.js';
import { FastJwtService, JwtService } from './services/jwt.service.js';
import { ApiWeatherService, WeatherService } from './services/weather.service.js';
import { SubscriptionService, WeatherSubscriptionService } from './services/subscription.service.js';
import { Server, HonoServer } from './server.js';
import { App, CronServerApp } from './app.js';
import { EmailService, ResendEmailService } from './services/email.service.js';
import { LoggerService, PinoLoggerService } from './services/logger.service.js';
import { DrizzleDbService } from './services/db.service.js';

export const makeDeps = () => {
  const loggerService: LoggerService = new PinoLoggerService();
  const dbService = new DrizzleDbService();
  const subscriptionRepository: SubscriptionRepository = new DrizzleSubscriptionRepository(dbService.getDb());
  const jwtService: JwtService = new FastJwtService();
  const weatherService: WeatherService = new ApiWeatherService();
  const emailService: EmailService = new ResendEmailService(loggerService.createLogger('ResendEmailService'));
  const subscriptionService: SubscriptionService = new WeatherSubscriptionService(
    jwtService,
    subscriptionRepository,
    weatherService,
    emailService,
    loggerService.createLogger('WeatherSubscriptionService'),
  );
  const cronService: CronService = new CronerCronService(subscriptionService);

  const server: Server = new HonoServer(weatherService, subscriptionService);
  const app: App = new CronServerApp(server, cronService, dbService, loggerService.createLogger('CronServerApp'));

  return {
    app,
    server,
    cronService,
    subscriptionService,
    emailService,
    weatherService,
    jwtService,
    subscriptionRepository,
    dbService,
  };
};
