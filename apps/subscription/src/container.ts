import { createChannel, createClient } from "nice-grpc";
import { ConfigService } from "./services/config.service.js";
import { DbService } from "./services/db.service.js";
import { JwtService } from "./services/jwt.service.js";
import { LoggerService } from "@weather-subscription/shared";
import { EmailServiceDefinition } from "@weather-subscription/proto/email";
import { WeatherServiceDefinition } from "@weather-subscription/proto/weather";
import { SubscriptionRepository } from "./repositories/subscription.repository.js";
import { SubscriptionService } from "./services/subscription.service.js";
import { Server } from "./server.js";
import { App } from "./app.js";

export class Container {
  public configService = new ConfigService();
  public config = this.configService.getConfig();

  public loggerService = new LoggerService(this);

  public dbService = new DbService(this);

  public jwtService = new JwtService(this);

  public emailClient = createClient(EmailServiceDefinition, createChannel(this.config.EMAIL_SERVICE_URL));
  public weatherClient = createClient(WeatherServiceDefinition, createChannel(this.config.WEATHER_SERVICE_URL));

  public subscriptionRepository = new SubscriptionRepository(this);

  public subscriptionService = new SubscriptionService(this);

  public server = new Server(this);

  public app = new App(this);
}
