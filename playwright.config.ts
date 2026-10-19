import { defineConfig, devices } from '@playwright/test'

// End-to-end tests against the production build (npm run build first) and the test stack in
// e2e/stack (Postgres + GoTrue + PostgREST). See docs/SETUP.md → "Testing".
//   CI:    .github/workflows/ci.yml (e2e job)
//   local: PW_CHANNEL=chrome npm run test:e2e   (uses the installed Chrome instead of a download)
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    channel: process.env.PW_CHANNEL || undefined,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL || undefined }, dependencies: ['setup'] },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], channel: process.env.PW_CHANNEL || undefined },
      dependencies: ['setup'],
      testMatch: /smoke\.spec\.ts/,
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: 'npm run start', url: baseURL, reuseExistingServer: !process.env.CI, timeout: 120_000 },
})
