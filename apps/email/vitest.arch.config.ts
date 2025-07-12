import tsconfigPathsPlugin from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    watch: false,
    include: ['**/__tests__/arch/**/*.spec.ts'],
    testTimeout: 60_000, // architecture tests can take a while to finish
  },
  plugins: [tsconfigPathsPlugin()],
});
