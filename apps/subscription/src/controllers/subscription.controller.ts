import { Server } from 'nice-grpc';
import { SubscriptionService } from 'src/services/subscription.service.js';
import { Frequency as GrpcFrequency, SubscriptionServiceDefinition } from 'libs/proto/dist/subscription.js';
import { Frequency } from 'src/db.schema.js';
import { Exception } from 'src/exception.js';

const toFrequency = (frequency: GrpcFrequency) => {
  switch (frequency) {
    case GrpcFrequency.DAILY:
      return Frequency.Daily;
    case GrpcFrequency.HOURLY:
      return Frequency.Hourly;
    default: {
      throw Exception.InternalServerError(`Unknown frequency: ${frequency}`);
    }
  }
};

export const makeSubscription = (server: Server, subscriptionService: SubscriptionService) => {
  server.add(SubscriptionServiceDefinition, {
    subscribe: async ({ frequency, ...rest }) => {
      await subscriptionService.subscribe({ frequency: toFrequency(frequency), ...rest });

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
      await subscriptionService.handleSubscriptions(toFrequency(options.frequency));

      return {};
    },
  });
};
