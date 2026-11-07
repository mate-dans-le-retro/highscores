import { defineConfig } from 'vitest/config'

// Kept apart from vite.config.ts. Plain modules stay on node; React tests use
// jsdom (also set with `/** @vitest-environment jsdom */` in each `*.test.tsx`).
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
  },
})
