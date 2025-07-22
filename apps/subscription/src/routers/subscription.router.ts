import { Server } from 'nice-grpc';
import { SubscriptionService } from 'src/services/subscription.service.js';
import { SubscriptionServiceDefinition } from '@weather-subscription/proto/subscription';
import { fromGrpcFrequency } from '@weather-subscription/shared';

export type Dependencies = {
  subscriptionService: SubscriptionService;
};

export class SubscriptionRouter {
  private subscriptionService: SubscriptionService;

  constructor({ subscriptionService }: Dependencies) {
    this.subscriptionService = subscriptionService;
  }

  public setup(server: Server) {
    server.add(SubscriptionServiceDefinition, {
      subscribe: async ({ frequency, ...rest }) => {
        await this.subscriptionService.subscribe({ frequency: fromGrpcFrequency(frequency), ...rest });
        return { message: 'Subscription successful. Confirmation email sent.' };
      },
      confirm: async ({ token }) => {
        await this.subscriptionService.confirm(token);
        return { message: 'Subscription confirmed successfully' };
      },
      unsubscribe: async ({ token }) => {
        await this.subscriptionService.unsubscribe(token);
        return { message: 'Unsubscribed successfully' };
      },
      handleSubscriptions: async ({ frequency }) => {
        await this.subscriptionService.handleSubscriptions(fromGrpcFrequency(frequency));
        return {};
      },
    });
  }
}
