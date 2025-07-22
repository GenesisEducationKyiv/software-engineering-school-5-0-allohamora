import { Server } from 'nice-grpc';
import { EmailService } from 'src/services/email.service.js';
import { EmailServiceDefinition } from '@weather-subscription/proto/email';

export type Dependencies = {
  emailService: EmailService;
};

export class EmailRouter {
  private emailService: EmailService;

  constructor({ emailService }: Dependencies) {
    this.emailService = emailService;
  }

  public setup(server: Server) {
    server.add(EmailServiceDefinition, {
      sendSubscribeEmail: async (options) => {
        await this.emailService.sendSubscribeEmail(options);
        return {};
      },

      sendWeatherUpdateEmail: async (options) => {
        await this.emailService.sendWeatherUpdateEmail(options);
        return {};
      },
    });
  }
}
