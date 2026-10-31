import { expect, test } from '@playwright/test'
import { authFile, serviceSelect } from '../helpers'
import { TEST_USERS } from '../users'

// One data path (docs/REMEDIATION_GUIDE.md 2.1): the members and ministries pages write through the
// API routes, and those routes enforce the roles.

/** A suffix unique to this test, retry and repeat, without the clock. */
const suffix = () => {
  const info = test.info()
  return `${info.testId.slice(0, 8)}${info.retry}${info.repeatEachIndex}`
}

type Profile = { id: string; phone: string | null }
const memberUser = TEST_USERS.member

test.describe('members page (admin)', () => {
  test.use({ storageState: authFile('admin') })

  test('edits a member\'s phone and sees it saved', async ({ page }) => {
    const [before] = await serviceSelect<Profile[]>(`profiles?select=id,phone&email=eq.${encodeURIComponent(memberUser.email)}`)
    const digits = [...suffix()].map((c) => c.charCodeAt(0) % 10).join('').slice(0, 8).padEnd(8, '0')
    const phone = `09${digits}`
    const name = `${memberUser.firstName} ${memberUser.lastName}`

    try {
      await page.goto('/dashboard/members')
      await page.getByRole('searchbox', { name: 'Search members' }).fill(memberUser.email)
      const row = page.getByTestId(`member-row-${before.id}`)
      await expect(row).toBeVisible()

      await row.getByRole('button', { name: `Edit ${name}` }).click()
      const dialog = page.getByRole('dialog', { name: 'Edit member' })
      await dialog.getByLabel('Phone').fill(phone)
      await dialog.getByRole('button', { name: 'Save changes' }).click()

      await expect(page.getByText(`Saved ${name}`)).toBeVisible()
      await expect(dialog).toBeHidden()
      await expect(row).toContainText(phone)
      const [after] = await serviceSelect<Profile[]>(`profiles?select=id,phone&id=eq.${before.id}`)
      expect(after.phone).toBe(phone)

      // Still there after a reload: it came from the database, not local state.
      await page.reload()
      await page.getByRole('searchbox', { name: 'Search members' }).fill(phone)
      await expect(page.getByTestId(`member-row-${before.id}`)).toContainText(phone)
    } finally {
      // Put the seeded user's phone back so other specs see the seed data.
      await page.request.patch(`/api/members/${before.id}`, { data: { phone: before.phone ?? '' } })
    }
  })
})

test.describe('ministries page (admin)', () => {
  test.use({ storageState: authFile('admin') })

  test('creates a ministry', async ({ page }) => {
    const name = `E2E Ministry ${suffix()}`
    await page.goto('/dashboard/ministries')
    await page.getByRole('button', { name: '+ Add Ministry' }).click()

    const dialog = page.getByRole('dialog', { name: 'Add Ministry' })
    await dialog.getByLabel('Name *').fill(name)
    await dialog.getByLabel('Meeting day').fill('Sunday')
    await dialog.getByLabel('Meeting time').fill('10:00 AM')
    await dialog.getByRole('button', { name: 'Add Ministry' }).click()

    await expect(page.getByText(`Added ${name}`)).toBeVisible()
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('row', { name: new RegExp(name) })).toContainText('Sunday 10:00 AM')
    const rows = await serviceSelect<{ name: string; meeting_day: string | null; is_active: boolean }[]>(
      `ministries?select=name,meeting_day,is_active&name=eq.${encodeURIComponent(name)}`,
    )
    expect(rows).toEqual([{ name, meeting_day: 'Sunday', is_active: true }])
  })
})

test.describe('member-edit API', () => {
  for (const role of ['member', 'elder'] as const) {
    test.describe(`as ${role}`, () => {
      test.use({ storageState: authFile(role) })

      test('refuses to edit or deactivate a member', async ({ page }) => {
        const [admin] = await serviceSelect<Profile[]>(`profiles?select=id,phone&email=eq.${encodeURIComponent(TEST_USERS.admin.email)}`)
        const patch = await page.request.patch(`/api/members/${admin.id}`, { data: { phone: '0900000000' } })
        expect(patch.status()).toBe(403)
        const del = await page.request.delete(`/api/members/${admin.id}`)
        expect(del.status()).toBe(403)

        const [after] = await serviceSelect<(Profile & { is_active: boolean })[]>(`profiles?select=id,phone,is_active&id=eq.${admin.id}`)
        expect(after.phone).toBe(admin.phone)
        expect(after.is_active).toBe(true)
      })
    })
  }

  test.describe('as member', () => {
    test.use({ storageState: authFile('member') })

    test('cannot list the directory', async ({ page }) => {
      expect((await page.request.get('/api/members')).status()).toBe(403)
    })
  })
})
