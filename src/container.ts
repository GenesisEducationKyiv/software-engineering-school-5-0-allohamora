import { CronerCronService, CronService } from './services/cron.service.js';
import { DrizzleSubscriptionRepository, SubscriptionRepository } from './repositories/subscription.repository.js';
import { FastJwtService, JwtService } from './services/jwt.service.js';
import { ApiWeatherService, WeatherService } from './services/weather.service.js';
import {
  HandleSubscriptionService,
  WeatherHandleSubscriptionService,
} from 'src/services/handle-subscription.service.js';
import { SubscriptionService, WeatherSubscriptionService } from './services/subscription.service.js';
import { Server, HonoServer } from './server.js';
import { App, CronServerApp } from './app.js';
import { SendEmailService, ResendSendEmailService } from 'src/services/send-email.service.js';
import { SendEmailTemplateService, JsxSendEmailTemplateService } from './services/send-email-template.service.js';
import { LoggerService, PinoLoggerService } from './services/logger.service.js';
import { DrizzleDbService } from './services/db.service.js';
import { ConfigService, ZnvConfigService } from './services/config.service.js';

export const createContainer = () => {
  const configService: ConfigService = new ZnvConfigService();
  const loggerService: LoggerService = new PinoLoggerService(configService);

  const dbService = new DrizzleDbService(configService);

  const subscriptionRepository: SubscriptionRepository = new DrizzleSubscriptionRepository(dbService.getConnection());

  const jwtService: JwtService = new FastJwtService(configService);

  const weatherService: WeatherService = new ApiWeatherService(configService);

  const sendEmailService: SendEmailService = new ResendSendEmailService(
    loggerService.createLogger('ResendSendEmailService'),
    configService,
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
    configService,
  );

  const subscriptionService: SubscriptionService = new WeatherSubscriptionService(
    jwtService,
    subscriptionRepository,
    weatherService,
    sendEmailTemplateService,
    configService,
  );

  const cronService: CronService = new CronerCronService(handleSubscriptionService);

  const server: Server = new HonoServer(weatherService, subscriptionService);

  const app: App = new CronServerApp(
    server,
    cronService,
    dbService,
    loggerService.createLogger('CronServerApp'),
    configService,
  );

  return {
    app,
    server,
    cronService,
    handleSubscriptionService,
    subscriptionService,
    sendEmailService,
    sendEmailTemplateService,
    weatherService,
    jwtService,
    subscriptionRepository,
    dbService,
    loggerService,
    configService,
  };
};

export type Container = ReturnType<typeof createContainer>;
