import { expect, test } from '@playwright/test'
import { authFile } from '../helpers'

// Remediation guide 2.8: the orphan dashboard pages and their unguarded API routes were deleted
// (any signed-in user could call them, and PUT wrote the request body straight to the table).
// These checks keep them from coming back unnoticed. They run as an admin, so a 404 means the
// route is gone for everyone, not just hidden from one role.
const REMOVED = [
  'community',
  'counseling',
  'education',
  'facilities',
  'health',
  'media',
  'music',
  'spiritual-service',
  'worship',
  'youth',
]

test.describe('as an admin', () => {
  test.use({ storageState: authFile('admin') })

  test('the removed dashboard pages are not found', async ({ page }) => {
    for (const name of REMOVED) {
      const res = await page.goto(`/dashboard/${name}`)
      expect(res?.status(), `/dashboard/${name}`).toBe(404)
    }
  })

  test('the removed API routes are not found, whatever the method', async ({ page }) => {
    for (const name of REMOVED) {
      for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
        const res = await page.request.fetch(`/api/${name}`, { method, data: method === 'GET' ? undefined : { id: 'x' } })
        expect(res.status(), `${method} /api/${name}`).toBe(404)
      }
    }
  })

  test('the ministry pages that replace two of them still open', async ({ page }) => {
    for (const path of ['/dashboard/ministry/spiritual-service', '/dashboard/ministry/youth']) {
      const res = await page.goto(path)
      expect(res?.status(), path).toBe(200)
      await expect(page).toHaveURL(new RegExp(`${path}$`))
    }
  })
})
