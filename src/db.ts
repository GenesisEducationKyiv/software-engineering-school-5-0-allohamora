import * as schema from './db.schema.js';
import path from 'node:path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE_DEBUG, POSTGRES_URL } from './config.js';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';

export const client = postgres(POSTGRES_URL);
export const db = drizzle(client, { schema, logger: DRIZZLE_DEBUG, casing: 'snake_case' });

const MIGRATIONS_DIR = path.join(import.meta.dirname, '..', 'migrations');

export const runMigrations = async () => {
  await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
};

export const disconnectFromDb = async () => {
  await client.end();
};

export const clearDb = async () => {
  const query = sql<string>`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';`;
  const rows = await db.execute(query);

  for (const table of rows) {
    const query = sql.raw(`TRUNCATE TABLE ${table.table_name} CASCADE;`);
    await db.execute(query);
  }
};
