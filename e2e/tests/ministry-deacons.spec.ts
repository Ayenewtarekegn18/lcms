import { expect, test, type Page } from '@playwright/test'
import { authFile, serviceSelect } from '../helpers'
import { TEST_USERS } from '../users'

// Deacons workspace: care visits and support cases are confidential (RLS: admin and elder only), so the
// routes refuse members and ministry leaders, and leaders see a "confidential" note instead of the lists.

const token = () => Math.random().toString(36).slice(2, 8)
const ZERO = '00000000-0000-0000-0000-000000000000'

const fitsWidth = (page: Page) =>
  page.evaluate(() => {
    const main = document.getElementById('main-content')
    return document.documentElement.scrollWidth <= window.innerWidth + 1 && !!main && main.scrollWidth <= main.clientWidth + 1
  })

const profileId = async (email: string) =>
  (await serviceSelect<{ id: string }[]>(`profiles?select=id&email=eq.${encodeURIComponent(email)}`))[0].id

async function pickMember(page: Page, label: RegExp, who: { firstName: string; lastName: string }) {
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel(label).fill(who.lastName)
  await dialog.getByRole('list', { name: 'Matching members' }).getByRole('button', { name: new RegExp(`${who.firstName} ${who.lastName}`) }).click()
}

test.describe('deacons workspace (admin)', () => {
  test.use({ storageState: authFile('admin') })

  test('records a care visit as the signed-in user, edits and deletes it', async ({ page }) => {
    const note = `E2E visit ${token()}`
    const member = TEST_USERS.member
    const adminId = await profileId(TEST_USERS.admin.email)
    const saved = () => serviceSelect<{ id: string; visit_date: string; notes: string; visitor_id: string; member_id: string }[]>(
      `deacon_care_visits?select=id,visit_date,notes,visitor_id,member_id&notes=like.${encodeURIComponent(`${note}*`)}`,
    )

    await page.goto('/dashboard/ministry/deacons#care-visits')
    await expect(page.getByRole('tab', { name: 'Care visits' })).toHaveAttribute('aria-selected', 'true')
    await page.getByRole('button', { name: 'Add care visit' }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Add care visit' })
    await pickMember(page, /^Member visited/, member)
    await dialog.getByLabel('Visit date').fill('2030-03-02')
    await dialog.getByLabel('Notes').fill(note)
    await dialog.getByRole('button', { name: 'Add', exact: true }).click()
    await expect(dialog).toBeHidden()

    const table = page.getByRole('table', { name: 'Care visits' })
    const row = table.getByRole('row').filter({ hasText: note })
    await expect(row).toContainText(`${member.firstName} ${member.lastName}`)
    await expect(row).toContainText(`${TEST_USERS.admin.firstName} ${TEST_USERS.admin.lastName}`)
    const [visit] = await saved()
    expect(visit).toMatchObject({ visit_date: '2030-03-02', notes: note, visitor_id: adminId, member_id: await profileId(member.email) })

    await row.getByRole('button', { name: /^Edit / }).click()
    const edit = page.getByRole('dialog', { name: 'Edit care visit' })
    await edit.getByLabel('Notes').fill(`${note} followed up`)
    await edit.getByRole('button', { name: 'Save changes' }).click()
    await expect(edit).toBeHidden()
    await expect(table.getByRole('row').filter({ hasText: `${note} followed up` })).toHaveCount(1)
    expect((await saved())[0].notes).toBe(`${note} followed up`)

    await table.getByRole('row').filter({ hasText: note }).getByRole('button', { name: /^Delete / }).click()
    await page.getByRole('dialog', { name: 'Delete this care visit?' }).getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Care visit deleted')).toBeVisible()
    expect(await saved()).toHaveLength(0)
  })

  test('opens a support case with an assigned deacon, moves it on and deletes it', async ({ page }) => {
    const text = `E2E case ${token()}`
    const elder = TEST_USERS.elder
    const saved = () => serviceSelect<{ id: string; status: string; case_type: string; assigned_deacon_id: string | null }[]>(
      `deacon_support_cases?select=id,status,case_type,assigned_deacon_id&description=eq.${encodeURIComponent(text)}`,
    )

    await page.goto('/dashboard/ministry/deacons')
    await page.getByRole('tab', { name: 'Support cases' }).click()
    await page.getByRole('button', { name: 'Add support case' }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Add support case' })
    await pickMember(page, /^Member/, TEST_USERS.member)
    await dialog.getByLabel('Type').selectOption('Health')
    await dialog.getByLabel('Description').fill(text)
    await pickMember(page, /^Assigned deacon/, elder)
    await dialog.getByRole('button', { name: 'Add', exact: true }).click()
    await expect(dialog).toBeHidden()

    const row = page.getByRole('table', { name: 'Support cases' }).getByRole('row').filter({ hasText: text })
    await expect(row).toContainText('Open')
    await expect(row).toContainText(`${elder.firstName} ${elder.lastName}`)
    expect(await saved()).toEqual([expect.objectContaining({ status: 'open', case_type: 'Health', assigned_deacon_id: await profileId(elder.email) })])

    await row.getByRole('button', { name: /^Edit / }).click()
    const edit = page.getByRole('dialog', { name: 'Edit support case' })
    await edit.getByLabel('Status').selectOption('in_progress')
    await edit.getByRole('button', { name: 'Save changes' }).click()
    await expect(edit).toBeHidden()
    await expect(row).toContainText('In progress')
    expect((await saved())[0]).toMatchObject({ status: 'in_progress', assigned_deacon_id: await profileId(elder.email) })

    await row.getByRole('button', { name: /^Delete / }).click()
    await page.getByRole('dialog', { name: 'Delete this support case?' }).getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Support case deleted')).toBeVisible()
    expect(await saved()).toHaveLength(0)
  })
})

test.describe('deacons workspace on a phone (admin)', () => {
  test.use({ storageState: authFile('admin'), viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('fits the screen, with cards instead of a table', async ({ page }) => {
    const text = `E2E phone case ${token()}`
    const created = await page.request.post('/api/deacon-support-cases', {
      data: { member_id: await profileId(TEST_USERS.member.email), description: text, case_type: 'Housing' },
    })
    expect(created.status()).toBe(201)
    const { id } = (await created.json()) as { id: string }
    try {
      await page.goto('/dashboard/ministry/deacons#support-cases')
      const cards = page.getByRole('list', { name: 'Support cases' })
      await expect(cards.getByRole('listitem').filter({ hasText: text })).toContainText('Housing')
      await expect(page.getByRole('table', { name: 'Support cases' })).toBeHidden()
      expect(await fitsWidth(page)).toBe(true)
      await page.goto('/dashboard/ministry/deacons#care-visits')
      await expect(page.getByRole('tab', { name: 'Care visits' })).toHaveAttribute('aria-selected', 'true')
      expect(await fitsWidth(page)).toBe(true)
    } finally {
      await page.request.delete(`/api/deacon-support-cases/${id}`)
    }
  })
})

for (const role of ['member', 'ministry_leader'] as const) {
  test.describe(`deacons workspace (${role})`, () => {
    test.use({ storageState: authFile(role) })

    test('is refused by the deacons APIs', async ({ page }) => {
      const memberId = await profileId(TEST_USERS.member.email)
      const calls = [
        page.request.get('/api/deacon-care-visits'),
        page.request.get('/api/deacon-support-cases'),
        page.request.post('/api/deacon-care-visits', { data: { member_id: memberId, visit_date: '2030-03-02' } }),
        page.request.post('/api/deacon-support-cases', { data: { member_id: memberId, description: 'x' } }),
        page.request.patch(`/api/deacon-care-visits/${ZERO}`, { data: { notes: 'x' } }),
        page.request.delete(`/api/deacon-care-visits/${ZERO}`),
        page.request.patch(`/api/deacon-support-cases/${ZERO}`, { data: { status: 'closed' } }),
        page.request.delete(`/api/deacon-support-cases/${ZERO}`),
      ]
      for (const res of await Promise.all(calls)) expect(res.status(), res.url()).toBe(403)

      await page.goto('/dashboard/ministry/deacons#care-visits')
      if (role === 'member') {
        await expect(page).toHaveURL(/\/dashboard(#.*)?$/)
      } else {
        await expect(page.getByText('Care visits are confidential.')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Add care visit' })).toHaveCount(0)
      }
    })
  })
}
