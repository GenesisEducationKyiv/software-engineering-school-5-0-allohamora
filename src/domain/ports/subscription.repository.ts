import { Frequency, Subscription } from '../entities/subscription.entity.js';
import { CreateSubscriptionDto } from '../dtos/create-subscription.dto.js';

export interface SubscriptionRepository {
  createSubscription(dto: CreateSubscriptionDto): Promise<Subscription>;
  isSubscriptionExists(email: string): Promise<boolean>;
  removeSubscriptionById(id: string): Promise<void>;
  iterateSubscriptions(frequency: Frequency, limit?: number): AsyncIterable<Subscription[]>;
}
