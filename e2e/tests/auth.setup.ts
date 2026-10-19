import { test as setup } from '@playwright/test'
import { E2E_USERS, type E2ERole } from '../users'
import { authFile, signIn } from '../helpers'

// Sign in once per role and keep the session cookies for the other tests.
for (const role of Object.keys(E2E_USERS) as E2ERole[]) {
  setup(`sign in as ${role}`, async ({ page }) => {
    await signIn(page, role)
    await page.context().storageState({ path: authFile(role) })
  })
}
