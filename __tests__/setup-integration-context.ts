import './mocks';
import { Db } from 'src/services/db.service.js';
import { Container, createContainer } from 'src/container.js';

const container = createContainer();
export const ctx: Container & { db: Db } = { ...container, db: container.dbService.getConnection() };

beforeAll(async () => {
  await ctx.dbService.runMigrations();
});

afterEach(async () => {
  await ctx.dbService.clearDb();
  await ctx.cacheService.clearAll();
});

afterAll(async () => {
  await ctx.dbService.disconnectFromDb();
});
