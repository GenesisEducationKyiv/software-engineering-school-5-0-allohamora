import * as schema from '../db.schema.js';
import path from 'node:path';
import postgres from 'postgres';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
import { Logger, LoggerService } from '@weather-subscription/shared';

const MIGRATIONS_DIR = path.join(import.meta.dirname, '..', '..', 'migrations');

export type Db = PostgresJsDatabase<typeof schema> & {
  $client: postgres.Sql;
};

type Dependencies = {
  loggerService: LoggerService;
  config: { POSTGRES_URL: string; DRIZZLE_DEBUG: boolean };
};

export class DbService {
  private client: postgres.Sql;
  private db: Db;

  private logger: Logger;

  constructor({ loggerService, config }: Dependencies) {
    this.client = postgres(config.POSTGRES_URL, { onnotice: () => {} });
    this.db = drizzle(this.client, { schema, logger: config.DRIZZLE_DEBUG, casing: 'snake_case' });

    this.logger = loggerService.createLogger('DbService');
  }

  public getConnection() {
    return this.db;
  }

  public async runMigrations() {
    await migrate(this.db, { migrationsFolder: MIGRATIONS_DIR });

    this.logger.info({ msg: 'Database migrations have been run' });
  }

  public async disconnectFromDb() {
    await this.client.end();

    this.logger.info({ msg: 'Disconnected from the database' });
  }

  public async clearDb() {
    this.logger.warn({ msg: 'Clearing the database' });

    const query = sql<string>`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';`;
    const rows = await this.db.execute(query);

    for (const table of rows) {
      const query = sql.raw(`TRUNCATE TABLE ${table.table_name} CASCADE;`);
      await this.db.execute(query);
    }
  }
}
