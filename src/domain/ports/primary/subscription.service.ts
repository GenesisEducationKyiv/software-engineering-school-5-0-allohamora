import { Frequency } from 'src/domain/entities/subscription.entity.js';

export type SubscribeOptions = {
  email: string;
  city: string;
  frequency: Frequency;
};

export interface SubscriptionService {
  handleSubscriptions(frequency: Frequency): Promise<void>;
  subscribe(options: SubscribeOptions): Promise<void>;
  confirm(token: string): Promise<void>;
  unsubscribe(subscriptionId: string): Promise<void>;
}
