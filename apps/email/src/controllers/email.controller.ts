import { Server } from 'nice-grpc';
import { EmailService } from 'src/services/email.service.js';
import { EmailServiceDefinition } from 'libs/proto/dist/email.js';

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
