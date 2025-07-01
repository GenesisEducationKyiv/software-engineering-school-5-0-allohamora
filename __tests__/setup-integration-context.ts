import './mocks';
import { Container } from 'src/container.js';

export const ctx = new Container();

beforeAll(async () => {
  await ctx.dbService.runMigrations();
});

afterEach(async () => {
  ctx.metricsService.clearMetrics();
  await ctx.dbService.clearDb();
  await ctx.cacheService.clearAll();
});

afterAll(async () => {
  await ctx.dbService.disconnectFromDb();
});
