import './mocks/index.js';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { Container } from 'src/container.js';

export const ctx = new Container();

beforeAll(async () => {
  await ctx.dbService.runMigrations();
});

afterEach(async () => {
  await ctx.dbService.clearDb();
});

afterAll(async () => {
  await ctx.dbService.disconnectFromDb();
});
