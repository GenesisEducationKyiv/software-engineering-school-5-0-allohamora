import './mocks';
import { DrizzleDb } from 'src/services/db.service.js';
import { makeDeps } from 'src/deps.js';

const deps = makeDeps();
export const ctx: ReturnType<typeof makeDeps> & { db: DrizzleDb } = { ...deps, db: deps.dbService.getConnection() };

beforeAll(async () => {
  await ctx.dbService.runMigrations();
});

afterEach(async () => {
  await ctx.dbService.clearDb();
});

afterAll(async () => {
  await ctx.dbService.disconnectFromDb();
});
