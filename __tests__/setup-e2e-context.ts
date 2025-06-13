import './mocks';
import { DrizzleDb } from 'src/services/db.service.js';
import { makeDeps } from 'src/deps.js';

/* eslint-disable no-var */
declare global {
  var ctx: ReturnType<typeof makeDeps> & { db: DrizzleDb };
}
/* eslint-enable no-var */

beforeAll(async () => {
  const deps = makeDeps();
  globalThis.ctx = { ...deps, db: deps.dbService.getDb() };

  await ctx.dbService.runMigrations();
});

afterEach(async () => {
  await ctx.dbService.clearDb();
});

afterAll(async () => {
  await ctx.dbService.disconnectFromDb();
});
