import * as schema from '../db.schema.js';
import path from 'node:path';
import postgres from 'postgres';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
import { ConfigService } from './config.service.js';

const MIGRATIONS_DIR = path.join(import.meta.dirname, '..', '..', 'migrations');

export type Db = PostgresJsDatabase<typeof schema> & {
  $client: postgres.Sql;
};

export class DbService {
  private client: postgres.Sql;
  private db: Db;

  constructor(configService: ConfigService) {
    this.client = postgres(configService.get('POSTGRES_URL'), { onnotice: () => {} });
    this.db = drizzle(this.client, { schema, logger: configService.get('DRIZZLE_DEBUG'), casing: 'snake_case' });
  }

  public getConnection() {
    return this.db;
  }

  public async runMigrations() {
    await migrate(this.db, { migrationsFolder: MIGRATIONS_DIR });
  }

  public async disconnectFromDb() {
    await this.client.end();
  }

  public async clearDb() {
    const query = sql<string>`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';`;
    const rows = await this.db.execute(query);

    for (const table of rows) {
      const query = sql.raw(`TRUNCATE TABLE ${table.table_name} CASCADE;`);
      await this.db.execute(query);
    }
  }
}
