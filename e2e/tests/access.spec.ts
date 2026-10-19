import { expect, test } from '@playwright/test'
import { PAGE_ACCESS } from '../../lib/auth/roles'
import { E2E_USERS, type E2ERole } from '../users'
import { authFile } from '../helpers'

// Every gated section, checked for every role against PAGE_ACCESS (the server-side layout gates).
const PATHS: Record<keyof typeof PAGE_ACCESS, string> = {
  members: '/dashboard/members',
  registerMember: '/dashboard/members/register',
  financial: '/dashboard/financial',
  communications: '/dashboard/communications',
  documents: '/dashboard/documents',
  reports: '/dashboard/reports',
  auditLog: '/dashboard/audit-log',
  ministry: '/dashboard/ministry',
  events: '/dashboard/events',
  attendance: '/dashboard/attendance',
}

test('signed-out visitors are sent to the login page', async ({ page }) => {
  for (const path of ['/dashboard', PATHS.members, PATHS.financial]) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/auth\/login$/)
  }
})

for (const role of Object.keys(E2E_USERS) as E2ERole[]) {
  test.describe(`as ${role}`, () => {
    test.use({ storageState: authFile(role) })

    for (const [section, path] of Object.entries(PATHS) as [keyof typeof PAGE_ACCESS, string][]) {
      const allowed = (PAGE_ACCESS[section] as readonly string[]).includes(role)
      test(`${allowed ? 'can open' : 'is turned away from'} ${path}`, async ({ page }) => {
        await page.goto(path)
        await expect(page).toHaveURL(allowed ? new RegExp(`${path}$`) : /\/dashboard$/)
      })
    }
  })
}
