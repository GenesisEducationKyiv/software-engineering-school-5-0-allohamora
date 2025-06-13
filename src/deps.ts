import { CronerCronService, CronService } from './services/cron.service.js';
import { DrizzleSubscriptionRepository, SubscriptionRepository } from './repositories/subscription.repository.js';
import { FastJwtService, JwtService } from './services/jwt.service.js';
import { ApiWeatherService, WeatherService } from './services/weather.service.js';
import {
  HandleSubscriptionService,
  WeatherHandleSubscriptionService,
} from 'src/services/handle-subscription.service.js';
import { SubscribeService, WeatherSubscribeService } from './services/subscribe.service.js';
import { Server, HonoServer } from './server.js';
import { App, CronServerApp } from './app.js';
import { SendEmailService, ResendSendEmailService } from 'src/services/send-email.service.js';
import { SendEmailTemplateService, JsxSendEmailTemplateService } from './services/send-email-template.service.js';
import { LoggerService, PinoLoggerService } from './services/logger.service.js';
import { DrizzleDbService } from './services/db.service.js';

export const makeDeps = () => {
  const loggerService: LoggerService = new PinoLoggerService();
  const dbService = new DrizzleDbService();
  const subscriptionRepository: SubscriptionRepository = new DrizzleSubscriptionRepository(dbService.getDb());
  const jwtService: JwtService = new FastJwtService();
  const weatherService: WeatherService = new ApiWeatherService();
  const sendEmailService: SendEmailService = new ResendSendEmailService(
    loggerService.createLogger('ResendSendEmailService'),
  );
  const sendEmailTemplateService: SendEmailTemplateService = new JsxSendEmailTemplateService(
    sendEmailService,
    loggerService.createLogger('JsxSendEmailTemplateService'),
  );
  const handleSubscriptionService: HandleSubscriptionService = new WeatherHandleSubscriptionService(
    subscriptionRepository,
    weatherService,
    sendEmailTemplateService,
    loggerService.createLogger('WeatherHandleSubscriptionService'),
  );
  const subscribeService: SubscribeService = new WeatherSubscribeService(
    jwtService,
    subscriptionRepository,
    weatherService,
    sendEmailTemplateService,
  );
  const cronService: CronService = new CronerCronService(handleSubscriptionService);

  const server: Server = new HonoServer(weatherService, subscribeService);
  const app: App = new CronServerApp(server, cronService, dbService, loggerService.createLogger('CronServerApp'));

  return {
    app,
    server,
    cronService,
    handleSubscriptionService,
    subscribeService,
    sendEmailService,
    sendEmailTemplateService,
    weatherService,
    jwtService,
    subscriptionRepository,
    dbService,
  };
};
