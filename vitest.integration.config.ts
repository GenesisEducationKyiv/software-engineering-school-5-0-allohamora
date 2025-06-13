import tsconfigPathsPlugin from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    watch: false,
    maxWorkers: 1,
    minWorkers: 1,
    poolOptions: {
      threads: {
        singleThread: true,
        minThreads: 1,
        maxThreads: 1,
      },
      forks: {
        singleFork: true,
        minForks: 1,
        maxForks: 1,
      },
    },
    setupFiles: ['./__tests__/setup-integration-context.ts'],
  },
  plugins: [tsconfigPathsPlugin()],
});
