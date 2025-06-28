import { CronService } from './services/cron.service.js';
import { SubscriptionRepository } from './repositories/subscription.repository.js';
import { JwtService } from './services/jwt.service.js';
import { HandleSubscriptionService } from 'src/services/handle-subscription.service.js';
import { SubscriptionService } from './services/subscription.service.js';
import { Server } from './server.js';
import { App } from './app.js';
import { SendEmailService } from 'src/services/send-email.service.js';
import { SendEmailTemplateService } from './services/send-email-template.service.js';
import { DbService } from './services/db.service.js';
import { ConfigService } from './services/config.service.js';
import { ApiWeatherProvider } from './providers/weather/api-weather.provider.js';
import { OpenMeteoProvider } from './providers/weather/open-meteo.provider.js';
import { FetchHttpProvider } from './providers/http/fetch.provider.js';
import { LoggerHttpProviderDecorator } from './providers/http/logger.provider.js';
import { HttpProvider } from './providers/http/http.provider.js';
import { WeatherService } from './services/weather.service.js';
import { PinoLoggerProvider } from './providers/logger/pino.provider.js';
import { FsLoggerProvider } from './providers/logger/fs.provider.js';

export const createContainer = () => {
  const configService = new ConfigService();
  const loggerProvider = new PinoLoggerProvider(configService);

  const httpProvider: HttpProvider = new LoggerHttpProviderDecorator(
    new FetchHttpProvider(),
    configService,
    new FsLoggerProvider(configService),
  );

  const dbService = new DbService(configService);

  const subscriptionRepository = new SubscriptionRepository(dbService);

  const jwtService = new JwtService(configService);

  const weatherService = new WeatherService(
    [new ApiWeatherProvider(httpProvider, configService), new OpenMeteoProvider(httpProvider)],
    loggerProvider,
  );

  const sendEmailService = new SendEmailService(loggerProvider, configService);

  const sendEmailTemplateService = new SendEmailTemplateService(sendEmailService, loggerProvider);

  const handleSubscriptionService = new HandleSubscriptionService(
    subscriptionRepository,
    weatherService,
    sendEmailTemplateService,
    loggerProvider,
    configService,
  );

  const subscriptionService = new SubscriptionService(
    jwtService,
    subscriptionRepository,
    weatherService,
    sendEmailTemplateService,
    configService,
  );

  const cronService = new CronService(handleSubscriptionService);

  const server = new Server(weatherService, subscriptionService);

  const app = new App(server, cronService, dbService, loggerProvider, configService);

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
    httpProvider,
    loggerProvider,
    configService,
  };
};

export type Container = ReturnType<typeof createContainer>;
