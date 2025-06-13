import { eq } from 'drizzle-orm';
import { db } from 'src/db.js';
import { Frequency, subscriptions } from 'src/db.schema.js';
import { Exception, ExceptionCode } from 'src/exception.js';

export type SubscriptionRepository = {
  createSubscription(data: typeof subscriptions.$inferInsert): Promise<typeof subscriptions.$inferSelect>;
  isSubscriptionExists(email: string): Promise<boolean>;
  removeSubscriptionById(id: string): Promise<(typeof subscriptions.$inferSelect)[]>;
  iterateSubscriptions(frequency: Frequency, limit?: number): AsyncGenerator<(typeof subscriptions.$inferSelect)[]>;
};

export class DrizzleSubscriptionRepository implements SubscriptionRepository {
  async createSubscription(data: typeof subscriptions.$inferInsert) {
    const [item] = await db.insert(subscriptions).values(data).returning();

    // type-guard
    if (!item) {
      throw new Exception(ExceptionCode.INTERNAL_SERVER_ERROR, 'Subscription was not returned');
    }

    return item;
  }

  async isSubscriptionExists(email: string) {
    const result = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.email, email),
    });

    return !!result;
  }

  async removeSubscriptionById(id: string) {
    return await db.delete(subscriptions).where(eq(subscriptions.id, id)).returning();
  }

  async *iterateSubscriptions(frequency: Frequency, limit = 50) {
    let offset = 0;

    while (true) {
      const subscriptionsBatch = await db.query.subscriptions.findMany({
        where: eq(subscriptions.frequency, frequency),
        limit,
        offset,
      });

      if (subscriptionsBatch.length === 0) {
        break;
      }

      yield subscriptionsBatch;

      if (subscriptionsBatch.length < limit) {
        break;
      }

      offset += limit;
    }
  }
}
