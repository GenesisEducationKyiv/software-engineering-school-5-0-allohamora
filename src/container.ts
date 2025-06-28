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
import { FetchHttpProvider } from './providers/http/fetch.provider.js';
import { LoggerHttpProviderDecorator } from './providers/http/logger.provider.js';
import { HttpProvider } from './providers/http/http.provider.js';
import { WeatherService } from './services/weather.service.js';

export const createContainer = () => {
  const configService = new ConfigService();
  const loggerService = new LoggerService(configService);
  const httpProvider: HttpProvider = new LoggerHttpProviderDecorator(new FetchHttpProvider(), configService);

  const dbService = new DbService(configService);

  const subscriptionRepository = new SubscriptionRepository(dbService);

  const jwtService = new JwtService(configService);

  const weatherService = new WeatherService(
    [new ApiWeatherProvider(httpProvider, configService), new OpenMeteoProvider(httpProvider)],
    loggerService,
  );

  const sendEmailService = new SendEmailService(loggerService, configService);

  const sendEmailTemplateService = new SendEmailTemplateService(sendEmailService, loggerService);

  const handleSubscriptionService = new HandleSubscriptionService(
    subscriptionRepository,
    weatherService,
    sendEmailTemplateService,
    loggerService,
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

  const app = new App(server, cronService, dbService, loggerService, configService);

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
    loggerService,
    configService,
  };
};

export type Container = ReturnType<typeof createContainer>;
