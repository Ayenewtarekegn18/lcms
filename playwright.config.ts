import { defineConfig, devices } from '@playwright/test'

// End-to-end tests against a production build of the app and the local Supabase stack
// (npm run local:start). See docs/SETUP.md → "Testing".
//   local: npm run local:start, then PW_CHANNEL=chrome npm run test:e2e (uses your installed Chrome)
//   CI:    .github/workflows/ci.yml, e2e job (same script)
try {
  process.loadEnvFile('.env.development.local') // written by npm run local:start; never overrides
} catch {
  // no local stack settings: CI passes them in the environment
}

// The tests create and change data, so they only ever run against a stack on this machine.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(supabaseUrl)) {
  throw new Error(`End-to-end tests run only against the local stack, not ${supabaseUrl || '(no Supabase URL set)'}. Run npm run local:start first.`)
}

// Its own port, so the tests never talk to an app you're running yourself on :3000 (which may point
// at another Supabase). E2E_BASE_URL runs them against a server you started on purpose.
const PORT = 3100
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`

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
      testMatch: /(smoke|shell)\.spec\.ts/,
    },
  ],
  // CI builds in an earlier step. Locally the build runs here, with the local stack's settings above
  // (they take precedence over .env.local). Always a fresh server, so it can't be a stale build.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `${process.env.CI ? '' : 'npm run build && '}npm run start -- -p ${PORT}`,
        url: baseURL,
        reuseExistingServer: false,
        stdout: 'pipe', // build and server output show up as [WebServer] lines
        timeout: process.env.CI ? 120_000 : 900_000,
      },
})
