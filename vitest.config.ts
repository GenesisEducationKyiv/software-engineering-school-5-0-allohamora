import tsconfigPathsPlugin from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    watch: false,
    include: ['**/__tests__/unit/**/*.spec.ts'],
  },
  plugins: [tsconfigPathsPlugin()],
});
