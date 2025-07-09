import { Server } from 'nice-grpc';
import { SubscriptionService } from 'src/services/subscription.service.js';
import { SubscriptionServiceDefinition } from '@weather-subscription/proto/subscription';
import { fromGrpcFrequency } from '@weather-subscription/shared';

export const makeSubscription = (server: Server, subscriptionService: SubscriptionService) => {
  server.add(SubscriptionServiceDefinition, {
    subscribe: async ({ frequency, ...rest }) => {
      await subscriptionService.subscribe({ frequency: fromGrpcFrequency(frequency), ...rest });

      return { message: 'Subscription successful. Confirmation email sent.' };
    },
    confirm: async (options) => {
      await subscriptionService.confirm(options.token);

      return { message: 'Subscription confirmed successfully' };
    },
    unsubscribe: async (options) => {
      await subscriptionService.unsubscribe(options.token);

      return { message: 'Unsubscribed successfully' };
    },
    handleSubscriptions: async (options) => {
      await subscriptionService.handleSubscriptions(fromGrpcFrequency(options.frequency));

      return {};
    },
  });
};
