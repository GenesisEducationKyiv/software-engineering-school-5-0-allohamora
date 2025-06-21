import { CronService } from './services/cron.service.js';
import { SubscriptionRepository } from './repositories/subscription.repository.js';
import { JwtService } from './services/jwt.service.js';
import { HandleSubscriptionService } from 'src/services/handle-subscription.service.js';
import { SubscriptionService } from './services/subscription.service.js';
import { Server } from './server.js';
import { App } from './app.js';
import { SendEmailService } from 'src/services/send-email.service.js';
import { SendEmailTemplateService } from './services/send-email-template.service.js';
import { LoggerService } from './services/logger.service.js';
import { DbService } from './services/db.service.js';
import { ConfigService } from './services/config.service.js';
import { ApiWeatherProvider } from './providers/weather/api-weather.provider.js';
import { OpenMeteoProvider } from './providers/weather/open-meteo.provider.js';
import { HttpService } from './services/http.service.js';
import { HttpLoggerProxy } from './proxies/http-logger.proxy.js';
import { WeatherProvider } from './providers/weather/weather.provider.js';

export const makeDeps = () => {
  const configService = new ConfigService();
  const loggerService = new LoggerService(configService);
  const httpService: HttpService = new HttpLoggerProxy(new HttpService(), configService);

  const dbService = new DbService(configService);

  const subscriptionRepository = new SubscriptionRepository(dbService.getConnection());

  const jwtService = new JwtService(configService);

  const weatherProvider: WeatherProvider = new ApiWeatherProvider(httpService, configService).setNext(
    new OpenMeteoProvider(httpService),
  );

  const sendEmailService = new SendEmailService(loggerService.createLogger('SendEmailService'), configService);

  const sendEmailTemplateService = new SendEmailTemplateService(
    sendEmailService,
    loggerService.createLogger('SendEmailTemplateService'),
  );

  const handleSubscriptionService = new HandleSubscriptionService(
    subscriptionRepository,
    weatherProvider,
    sendEmailTemplateService,
    loggerService.createLogger('HandleSubscriptionService'),
    configService,
  );

  const subscriptionService = new SubscriptionService(
    jwtService,
    subscriptionRepository,
    weatherProvider,
    sendEmailTemplateService,
    configService,
  );

  const cronService = new CronService(handleSubscriptionService);

  const server = new Server(weatherProvider, subscriptionService);

  const app = new App(server, cronService, dbService, loggerService.createLogger('App'), configService);

  return {
    app,
    server,
    cronService,
    handleSubscriptionService,
    subscriptionService,
    sendEmailService,
    sendEmailTemplateService,
    weatherProvider,
    jwtService,
    subscriptionRepository,
    dbService,
    httpService,
    loggerService,
    configService,
  };
};
