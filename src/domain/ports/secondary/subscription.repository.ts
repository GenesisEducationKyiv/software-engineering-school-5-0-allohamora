import { Frequency, Subscription } from 'src/domain/entities/subscription.entity.js';

export interface CreateSubscriptionData {
  email: string;
  city: string;
  frequency: Frequency;
}

export interface SubscriptionRepository {
  createSubscription(data: CreateSubscriptionData): Promise<Subscription>;
  isSubscriptionExists(email: string): Promise<boolean>;
  removeSubscriptionById(id: string): Promise<void>;
  iterateSubscriptions(frequency: Frequency, limit?: number): AsyncIterable<Subscription[]>;
}
