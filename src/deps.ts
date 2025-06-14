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
import { ConfigService, ZnvConfigService } from './services/config.service.js';

export const makeDeps = () => {
  const configService: ConfigService = new ZnvConfigService();

  const loggerService: LoggerService = new PinoLoggerService(configService.get('PINO_LEVEL'));

  const dbService = new DrizzleDbService(configService.get('POSTGRES_URL'), configService.get('DRIZZLE_DEBUG'));

  const subscriptionRepository: SubscriptionRepository = new DrizzleSubscriptionRepository(dbService.getConnection());

  const jwtService: JwtService = new FastJwtService(
    configService.get('JWT_SECRET'),
    configService.get('JWT_EXPIRES_IN'),
  );

  const weatherService: WeatherService = new ApiWeatherService(configService.get('WEATHER_API_KEY'));

  const sendEmailService: SendEmailService = new ResendSendEmailService(
    loggerService.createLogger('ResendSendEmailService'),
    configService.get('EMAIL_NAME'),
    configService.get('EMAIL_FROM'),
    configService.get('RESEND_API_KEY'),
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
    configService.get('APP_URL'),
  );

  const subscribeService: SubscribeService = new WeatherSubscribeService(
    jwtService,
    subscriptionRepository,
    weatherService,
    sendEmailTemplateService,
    configService.get('APP_URL'),
  );

  const cronService: CronService = new CronerCronService(handleSubscriptionService);

  const server: Server = new HonoServer(weatherService, subscribeService);

  const app: App = new CronServerApp(
    server,
    cronService,
    dbService,
    loggerService.createLogger('CronServerApp'),
    configService.get('NODE_ENV'),
    configService.get('PORT'),
  );

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
    loggerService,
    configService,
  };
};
