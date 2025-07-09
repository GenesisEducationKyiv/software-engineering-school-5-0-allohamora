import { Server } from 'nice-grpc';
import { EmailService } from 'src/services/email.service.js';
import { EmailServiceDefinition } from '@weather-subscription/proto/email';

export const makeEmailRoutes = (server: Server, emailService: EmailService) => {
  server.add(EmailServiceDefinition, {
    sendSubscribeEmail: async (options) => {
      await emailService.sendSubscribeEmail(options);

      return {};
    },

    sendWeatherUpdateEmail: async (options) => {
      await emailService.sendWeatherUpdateEmail(options);

      return {};
    },
  });
};
