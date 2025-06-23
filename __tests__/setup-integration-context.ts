import './mocks';
import { DrizzleDb } from 'src/services/db.service.js';
import { Container, createContainer } from 'src/container.js';

const container = createContainer();
export const ctx: Container & { db: DrizzleDb } = { ...container, db: container.dbService.getConnection() };

beforeAll(async () => {
  await ctx.dbService.runMigrations();
});

afterEach(async () => {
  await ctx.dbService.clearDb();
});

afterAll(async () => {
  await ctx.dbService.disconnectFromDb();
});
