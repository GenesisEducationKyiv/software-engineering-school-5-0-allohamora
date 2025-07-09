import { Server } from 'nice-grpc';
import { EmailService } from 'src/services/email.service.js';
import { EmailServiceDefinition } from '@weather-subscription/proto/email';

export const makeEmailRoutes = (server: Server, weatherService: EmailService) => {
  server.add(EmailServiceDefinition, {
    sendSubscribeEmail: async (options) => {
      await weatherService.sendSubscribeEmail(options);

      return {};
    },

    sendWeatherUpdateEmail: async (options) => {
      await weatherService.sendWeatherUpdateEmail(options);

      return {};
    },
  });
};
