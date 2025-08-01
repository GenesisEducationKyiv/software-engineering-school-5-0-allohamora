import { Subscriber } from '@weather-subscription/queue';
import { Logger, LoggerService } from '@weather-subscription/shared';
import { EmailService } from 'src/services/email.service.js';

export type Dependencies = {
  subscriber: Subscriber;
  emailService: EmailService;
  loggerService: LoggerService;
};

export class EmailRouter {
  private subscriber: Subscriber;
  private emailService: EmailService;

  private logger: Logger;

  constructor({ subscriber, emailService, loggerService }: Dependencies) {
    this.subscriber = subscriber;
    this.emailService = emailService;

    this.logger = loggerService.createLogger('EmailRouter');
  }

  public async setup() {
    await this.subscriber.subscribe('send-subscribe-email', async (payload) => {
      await this.emailService.sendSubscribeEmail(payload);
    });

    await this.subscriber.subscribe('send-weather-update-email', async (payload) => {
      await this.emailService.sendWeatherUpdateEmail(payload);
    });

    this.logger.debug({ msg: 'EmailRouter has been set up' });
  }
}
