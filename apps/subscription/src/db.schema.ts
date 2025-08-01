import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { Frequency } from '@weather-subscription/shared';

export const subscriptions = pgTable('subscriptions', {
  id: uuid().notNull().defaultRandom().primaryKey(),
  email: varchar({ length: 255 }).notNull(),
  city: varchar({ length: 255 }).notNull(),
  frequency: varchar({ length: 10, enum: [Frequency.Daily, Frequency.Hourly] }).notNull(),
  createdAt: timestamp({ precision: 3, withTimezone: true })
    .notNull()
    .$default(() => new Date()),
});
