import { test as setup } from '@playwright/test'
import { TEST_USERS, type TestRole } from '../users'
import { authFile, signIn } from '../helpers'

// Sign in once per role and keep the session cookies for the other tests.
for (const role of Object.keys(TEST_USERS) as TestRole[]) {
  setup(`sign in as ${role}`, async ({ page }) => {
    await signIn(page, role)
    await page.context().storageState({ path: authFile(role) })
  })
}
