import { Container } from 'src/infrastructure/container.js';
import './mocks/index.js';

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
