import './mocks/index.js';
import { Container } from 'src/container.js';

export const ctx = new Container();

beforeAll(async () => {
  await ctx.dbProvider.runMigrations();
});

afterEach(async () => {
  ctx.metricsProvider.clearMetrics();
  await ctx.dbProvider.clearDb();
  await ctx.cacheProvider.clearAll();
});

afterAll(async () => {
  await ctx.dbProvider.disconnectFromDb();
});
