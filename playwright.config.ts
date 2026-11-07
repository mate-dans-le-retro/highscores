import { defineConfig, devices } from '@playwright/test'

const port = 4173
const baseURL = `http://127.0.0.1:${port}`

/**
 * Browser smoke against a production build. Mock mode comes from `?mock=1`
 * (and from VITE_DATA_SOURCE during the build) so no Supabase is required.
 * CI does not run these yet; enable later when Clément wants the job.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 60_000,
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `pnpm build && pnpm preview --host 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      ...process.env,
      VITE_DATA_SOURCE: 'mock',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
