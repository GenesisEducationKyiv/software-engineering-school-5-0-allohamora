export const enum Frequency {
  Hourly = 'hourly',
  Daily = 'daily',
}

export interface Subscription {
  id: string;
  email: string;
  city: string;
  frequency: Frequency;
  createdAt: Date;
}
