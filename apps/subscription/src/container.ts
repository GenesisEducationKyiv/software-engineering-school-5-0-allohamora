import { createChannel, createClient } from 'nice-grpc';
import { ConfigService } from './services/config.service.js';
import { DbService } from './services/db.service.js';
import { JwtService } from './services/jwt.service.js';
import { GrpcService, LoggerService, MetricsService, GrpcMetricsService } from '@weather-subscription/shared';
import { WeatherServiceDefinition } from '@weather-subscription/proto/weather';
import { SubscriptionRepository } from './repositories/subscription.repository.js';
import { SubscriptionService } from './services/subscription.service.js';
import { KafkaProvider } from '@weather-subscription/queue';
import { SubscriptionRouter } from './routers/subscription.router.js';
import { Server } from './server.js';
import { App } from './app.js';

export class Container {
  public configService = new ConfigService();
  public config = this.configService.getConfig();

  public loggerService = new LoggerService(this);

  public metricsService = new MetricsService(this);
  public grpcMetricsService = new GrpcMetricsService(this);

  public dbService = new DbService(this);

  public jwtService = new JwtService(this);

  public weatherClient = createClient(WeatherServiceDefinition, createChannel(this.config.WEATHER_SERVICE_URL));

  public queueProvider = new KafkaProvider(this);

  public publisher = this.queueProvider.createPublisher();

  public subscriptionRepository = new SubscriptionRepository(this);

  public subscriptionService = new SubscriptionService(this);

  public subscriptionRouter = new SubscriptionRouter(this);

  public grpcService = new GrpcService(this);

  public server = new Server(this);

  public app = new App(this);
}
