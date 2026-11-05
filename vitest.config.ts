import { defineConfig } from 'vitest/config'

// Kept apart from vite.config.ts: the tests only cover plain TypeScript
// modules and do not need the TanStack Start, Nitro or Tailwind plugins.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: { include: ['src/**/*.test.ts'] },
})
