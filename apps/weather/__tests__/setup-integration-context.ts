import './mocks/index.js';
import { beforeEach } from 'vitest';
import { Container } from 'src/container.js';

export const ctx = new Container();

beforeEach(async () => {
  await ctx.cacheService.clearAll();
});
