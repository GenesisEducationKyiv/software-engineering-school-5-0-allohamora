import { Frequency } from '../entities/subscription.entity.js';

export interface CreateSubscriptionDto {
  email: string;
  city: string;
  frequency: Frequency;
}
