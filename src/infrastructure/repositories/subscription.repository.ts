import { eq } from 'drizzle-orm';
import { subscriptions } from 'src/infrastructure/db.schema.js';
import { Exception } from 'src/exception.js';
import { Db, DbProvider } from '../providers/db.provider.js';
import { SubscriptionRepository } from 'src/domain/repositories/subscription.repository.js';
import { CreateSubscriptionDto } from 'src/domain/dtos/create-subcription.dto.js';
import { Frequency } from 'src/domain/entities/subscription.entity.js';

type Options = {
  dbProvider: DbProvider;
};

export class DrizzleSubscriptionRepository implements SubscriptionRepository {
  private db: Db;

  constructor({ dbProvider }: Options) {
    this.db = dbProvider.getConnection();
  }

  async createSubscription(data: CreateSubscriptionDto) {
    const [item] = await this.db.insert(subscriptions).values(data).returning();

    // type-guard
    if (!item) {
      throw Exception.InternalServerError('Subscription was not returned');
    }

    return item;
  }

  async isSubscriptionExists(email: string) {
    const result = await this.db.query.subscriptions.findFirst({
      where: eq(subscriptions.email, email),
    });

    return !!result;
  }

  async removeSubscriptionById(id: string) {
    await this.db.delete(subscriptions).where(eq(subscriptions.id, id)).returning();
  }

  async *iterateSubscriptions(frequency: Frequency, limit = 50) {
    let offset = 0;

    while (true) {
      const subscriptionsBatch = await this.db.query.subscriptions.findMany({
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
