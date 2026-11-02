import { expect, test, type Page } from '@playwright/test'
import { authFile, serviceSelect } from '../helpers'
import { TEST_USERS } from '../users'

// Youth Ministry workspace (docs/MINISTRY_WORKSPACES.md): programs (member-readable) and mentoring
// pairs (staff only), through their API routes; only staff write.

const unique = (label: string) =>
  `${label} ${test.info().testId.slice(0, 6)}${test.info().retry}-${Math.random().toString(36).slice(2, 8)}`

const ZERO = '00000000-0000-0000-0000-000000000000'

const fitsWidth = (page: Page) =>
  page.evaluate(() => {
    const main = document.getElementById('main-content')
    return document.documentElement.scrollWidth <= window.innerWidth + 1 && !!main && main.scrollWidth <= main.clientWidth + 1
  })

const profileId = async (email: string) =>
  (await serviceSelect<{ id: string }[]>(`profiles?select=id&email=eq.${encodeURIComponent(email)}`))[0].id

async function pickMember(scope: ReturnType<Page['getByRole']>, label: RegExp, user: { firstName: string; lastName: string }) {
  await scope.getByLabel(label).fill(user.lastName)
  await scope.getByRole('list', { name: 'Matching members' }).getByRole('button', { name: new RegExp(`${user.firstName} ${user.lastName}`) }).click()
}

type Program = { id: string; name: string; program_date: string; program_type: string; max_participants: number; leader_id: string; location: string | null; is_active: boolean }

test.describe('youth ministry (admin)', () => {
  test.use({ storageState: authFile('admin') })

  test('adds a program with a leader, edits it and deletes it after confirming', async ({ page }) => {
    const name = unique('E2E Retreat')
    const leader = TEST_USERS.ministry_leader
    const leaderId = await profileId(leader.email)
    const saved = async () => (await serviceSelect<Program[]>(
      `youth_programs?select=id,name,program_date,program_type,max_participants,leader_id,location,is_active&name=eq.${encodeURIComponent(name)}`,
    ))[0]

    await page.goto('/dashboard/ministry/youth#programs')
    await expect(page.getByRole('heading', { name: 'Youth Ministry' })).toBeVisible()
    await page.getByRole('button', { name: 'Add program' }).first().click()
    const add = page.getByRole('dialog', { name: 'Add program' })
    await add.getByLabel('Name').fill(name)
    await add.getByLabel('Date').fill('2030-05-04')
    await add.getByLabel('Type').selectOption('retreat')
    await add.getByLabel('Ages').fill('13–18')
    await add.getByLabel('Places').fill('40')
    await add.getByLabel('Where').fill('Camp Ground')
    await pickMember(add, /^Leader/, leader)
    await add.getByRole('button', { name: 'Add', exact: true }).click()
    await expect(add).toBeHidden()

    await page.getByRole('searchbox', { name: 'Search programs' }).fill(name)
    const row = page.getByRole('table', { name: 'Programs' }).getByRole('row').filter({ hasText: name })
    await expect(row).toContainText('4 May 2030')
    await expect(row).toContainText('Retreat')
    await expect(row).toContainText(`${leader.firstName} ${leader.lastName}`)
    await expect(row).toContainText('Up to 40')
    const program = await saved()
    expect(program).toMatchObject({ program_type: 'retreat', max_participants: 40, leader_id: leaderId, is_active: true })
    expect(program.program_date).toMatch(/^2030-05-04/)

    try {
      // Edit: the date reads back as the day; change the place and deactivate.
      await row.getByRole('button', { name: `Edit ${name}` }).click()
      const edit = page.getByRole('dialog', { name: 'Edit program' })
      await expect(edit.getByLabel('Date')).toHaveValue('2030-05-04')
      await edit.getByLabel('Where').fill('Main Hall')
      await edit.getByLabel('Active (shown to members)').uncheck()
      await edit.getByRole('button', { name: 'Save changes' }).click()
      await expect(edit).toBeHidden()
      await expect(row).toContainText('Inactive')
      expect(await saved()).toMatchObject({ location: 'Main Hall', is_active: false, leader_id: leaderId })

      await row.getByRole('button', { name: `Delete ${name}` }).click()
      const confirm = page.getByRole('dialog', { name: 'Delete this program?' })
      await confirm.getByRole('button', { name: 'Cancel' }).click()
      expect(await saved()).toBeTruthy()
      await row.getByRole('button', { name: `Delete ${name}` }).click()
      await page.getByRole('dialog', { name: 'Delete this program?' }).getByRole('button', { name: 'Delete' }).click()
      await expect(page.getByText('Program deleted')).toBeVisible()
      expect(await saved()).toBeUndefined()
    } finally {
      const left = await saved()
      if (left) await page.request.delete(`/api/youth-programs/${left.id}`)
    }
  })

  test('pairs a young person with a mentor, edits the pair and deletes it', async ({ page }) => {
    const mentee = TEST_USERS.member
    const mentor = TEST_USERS.elder
    const menteeId = await profileId(mentee.email)
    const mentorId = await profileId(mentor.email)
    const pair = () => serviceSelect<{ id: string; mentor_id: string; notes: string | null; is_active: boolean }[]>(
      `youth_mentorship?select=id,mentor_id,notes,is_active&mentee_id=eq.${menteeId}`,
    )
    // One mentor per mentee: start from none, whatever earlier runs left behind.
    for (const p of await pair()) await page.request.delete(`/api/youth-mentorship/${p.id}`)

    await page.goto('/dashboard/ministry/youth#mentorship')
    await page.getByRole('button', { name: 'Add mentoring pair' }).first().click()
    const add = page.getByRole('dialog', { name: 'Add mentoring pair' })
    await pickMember(add, /^Mentee/, mentee)
    await pickMember(add, /^Mentor/, mentee)
    await add.getByRole('button', { name: 'Add', exact: true }).click()
    await expect(add.getByText('Choose someone other than the mentee')).toBeVisible() // refused by the API
    await add.getByRole('button', { name: 'Choose someone else' }).last().click()
    await pickMember(add, /^Mentor/, mentor)
    await add.getByLabel('Notes').fill('Weekly coffee')
    await add.getByRole('button', { name: 'Add', exact: true }).click()
    await expect(add).toBeHidden()
    expect(await pair()).toMatchObject([{ mentor_id: mentorId, notes: 'Weekly coffee', is_active: true }])

    const label = `${mentee.firstName} ${mentee.lastName} with ${mentor.firstName} ${mentor.lastName}`
    const row = page.getByRole('table', { name: 'Mentorship' }).getByRole('row').filter({ hasText: `${mentee.firstName} ${mentee.lastName}` })
    await expect(row).toContainText(`${mentor.firstName} ${mentor.lastName}`)
    await row.getByRole('button', { name: `Edit ${label}` }).click()
    const edit = page.getByRole('dialog', { name: 'Edit mentoring pair' })
    await edit.getByLabel('Active (still meeting)').uncheck()
    await edit.getByRole('button', { name: 'Save changes' }).click()
    await expect(edit).toBeHidden()
    await expect(row).toContainText('Ended')
    expect(await pair()).toMatchObject([{ is_active: false }])

    // A second mentor for the same mentee is refused by the database.
    expect((await page.request.post('/api/youth-mentorship', { data: { mentee_id: menteeId, mentor_id: mentorId } })).status()).toBe(409)

    await row.getByRole('button', { name: `Delete ${label}` }).click()
    await page.getByRole('dialog', { name: 'Delete this mentoring pair?' }).getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Mentoring pair deleted')).toBeVisible()
    expect(await pair()).toHaveLength(0)
  })
})

test.describe('youth ministry on a phone (admin)', () => {
  test.use({ storageState: authFile('admin'), viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('programs and mentorship fit the screen, with cards instead of a table', async ({ page }) => {
    const name = unique('E2E Phone program')
    const created = await page.request.post('/api/youth-programs', { data: { name, program_date: '2030-06-01', program_type: 'worship', location: 'Chapel' } })
    expect(created.status()).toBe(201)
    const { id } = (await created.json()) as { id: string }

    try {
      await page.goto('/dashboard/ministry/youth#programs')
      await page.getByRole('searchbox', { name: 'Search programs' }).fill(name)
      const cards = page.getByRole('list', { name: 'Programs' })
      await expect(cards.getByRole('listitem').filter({ hasText: name })).toContainText('Worship')
      await expect(page.getByRole('table', { name: 'Programs' })).toBeHidden()
      expect(await fitsWidth(page)).toBe(true)

      await page.getByRole('tab', { name: 'Mentorship' }).click()
      await expect(page.getByRole('button', { name: 'Add mentoring pair' }).first()).toBeVisible()
      expect(await fitsWidth(page)).toBe(true)
    } finally {
      await page.request.delete(`/api/youth-programs/${id}`)
    }
  })
})

test.describe('youth ministry (member)', () => {
  test.use({ storageState: authFile('member') })

  test('is refused by the write APIs and the mentorship list', async ({ page }) => {
    const memberId = await profileId(TEST_USERS.member.email)
    const writes = [
      page.request.post('/api/youth-programs', { data: { name: unique('E2E Member program'), program_date: '2030-05-04' } }),
      page.request.post('/api/youth-mentorship', { data: { mentee_id: memberId, mentor_id: ZERO } }),
      page.request.patch(`/api/youth-programs/${ZERO}`, { data: { name: 'x' } }),
      page.request.delete(`/api/youth-programs/${ZERO}`),
      page.request.patch(`/api/youth-mentorship/${ZERO}`, { data: { notes: 'x' } }),
      page.request.delete(`/api/youth-mentorship/${ZERO}`),
    ]
    for (const res of await Promise.all(writes)) expect(res.status(), res.url()).toBe(403)
    expect((await page.request.get('/api/youth-mentorship')).status()).toBe(403)
    // Programs are member-readable.
    expect((await page.request.get('/api/youth-programs')).status()).toBe(200)

    await page.goto('/dashboard/ministry/youth')
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
