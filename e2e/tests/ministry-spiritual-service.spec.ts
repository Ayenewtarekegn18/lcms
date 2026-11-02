import { randomUUID } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'
import { authFile, serviceSelect } from '../helpers'
import { TEST_USERS, type TestRole } from '../users'

// Spiritual Service workspace (docs/MINISTRY_WORKSPACES.md): classes with their attendance, candidates,
// baptisms and follow-ups read and write through their API routes; staff write, members are refused,
// and pastoral follow-ups are for admins and elders only (a ministry leader is refused too).

const unique = (label: string) =>
  `${label} ${test.info().testId.slice(0, 6)}${test.info().retry}-${randomUUID().slice(0, 8)}`

const ZERO = '00000000-0000-0000-0000-000000000000'
const q = encodeURIComponent

const fitsWidth = (page: Page) =>
  page.evaluate(() => {
    const main = document.getElementById('main-content')
    return document.documentElement.scrollWidth <= window.innerWidth + 1 && !!main && main.scrollWidth <= main.clientWidth + 1
  })

const profileId = async (role: TestRole) =>
  (await serviceSelect<{ id: string }[]>(`profiles?select=id&email=eq.${q(TEST_USERS[role].email)}`))[0].id
const fullName = (role: TestRole) => `${TEST_USERS[role].firstName} ${TEST_USERS[role].lastName}`

/** Choose someone in a form's member picker by last name. */
async function pickMember(page: Page, dialogName: string, label: RegExp, role: TestRole) {
  const dialog = page.getByRole('dialog', { name: dialogName })
  await dialog.getByLabel(label).fill(TEST_USERS[role].lastName)
  await dialog.getByRole('list', { name: 'Matching members' }).getByRole('button', { name: new RegExp(fullName(role)) }).click()
}

const add = (page: Page, dialogName: string) =>
  page.getByRole('dialog', { name: dialogName }).getByRole('button', { name: 'Add', exact: true }).click()

test.describe('spiritual service (admin)', () => {
  test.use({ storageState: authFile('admin') })

  test('adds a class and keeps its attendance', async ({ page }) => {
    const title = unique('E2E Salvation basics')
    const elderId = await profileId('elder')

    await page.goto('/dashboard/ministry/spiritual-service#classes')
    await expect(page.getByRole('heading', { name: 'Spiritual Service' })).toBeVisible()
    await page.getByRole('button', { name: 'Add class' }).first().click()
    const c = page.getByRole('dialog', { name: 'Add class' })
    await c.getByLabel('Title').fill(title)
    await c.getByLabel('Date').fill('2030-06-01')
    await c.getByLabel('Seats').fill('20')
    await pickMember(page, 'Add class', /^Instructor/, 'elder')
    await add(page, 'Add class')
    await expect(c).toBeHidden()
    await page.getByRole('searchbox', { name: 'Search classes by title or place' }).fill(title)
    await expect(page.getByRole('table', { name: 'Classes' }).getByRole('row').filter({ hasText: title })).toContainText(fullName('elder'))
    const [cls] = await serviceSelect<{ id: string; instructor_id: string; max_attendees: number }[]>(
      `spiritual_classes?select=id,instructor_id,max_attendees&title=eq.${q(title)}`,
    )
    expect(cls).toMatchObject({ instructor_id: elderId, max_attendees: 20 })

    try {
      await page.getByRole('tab', { name: 'Attendance' }).click()
      await page.getByLabel('Class', { exact: true }).selectOption(cls.id)
      await expect(page.getByText('Nobody on this class list yet.')).toBeVisible()
      await page.getByRole('button', { name: 'Add person' }).first().click()
      await pickMember(page, 'Add person', /^Person/, 'elder')
      await add(page, 'Add person')
      await expect(page.getByText('Added to the class')).toBeVisible()
      const row = page.getByRole('table', { name: 'Attendance' }).getByRole('row').filter({ hasText: fullName('elder') })
      await expect(row).toContainText('Present')
      await expect(page.getByText('1 of 20')).toBeVisible()

      const saved = () => serviceSelect<{ id: string; attended: boolean }[]>(`spiritual_class_attendance?select=id,attended&class_id=eq.${cls.id}`)
      expect(await saved()).toMatchObject([{ attended: true }])
      await row.getByRole('button', { name: `Mark ${fullName('elder')} absent` }).click()
      await expect(row.getByRole('button', { name: `Mark ${fullName('elder')} present` })).toBeVisible()
      expect(await saved()).toMatchObject([{ attended: false }])

      await row.getByRole('button', { name: `Remove ${fullName('elder')}` }).click()
      await page.getByRole('dialog', { name: 'Remove from this class?' }).getByRole('button', { name: 'Remove' }).click()
      await expect(page.getByText('Nobody on this class list yet.')).toBeVisible()
      expect(await saved()).toHaveLength(0)
    } finally {
      await page.request.delete(`/api/spiritual-classes/${cls.id}`)
    }
  })

  test('adds a candidate, moves them on, filters by status and removes them', async ({ page }) => {
    const memberId = await profileId('finance')
    const name = fullName('finance')
    const saved = () => serviceSelect<{ id: string; status: string; progress_notes: string | null }[]>(
      `spiritual_candidates?select=id,status,progress_notes&member_id=eq.${memberId}`,
    )
    for (const old of await saved()) await page.request.delete(`/api/spiritual-candidates/${old.id}`)

    await page.goto('/dashboard/ministry/spiritual-service#candidates')
    await page.getByRole('button', { name: 'Add candidate' }).first().click()
    await pickMember(page, 'Add candidate', /^Candidate/, 'finance')
    await add(page, 'Add candidate')
    await expect(page.getByText('Candidate added')).toBeVisible()
    expect(await saved()).toMatchObject([{ status: 'salvation_candidate' }])

    await page.getByRole('searchbox', { name: 'Search candidates by name' }).fill(name)
    const row = page.getByRole('table', { name: 'Candidates' }).getByRole('row').filter({ hasText: name })
    await expect(row).toContainText('Salvation candidate')
    await row.getByRole('button', { name: `Edit ${name}` }).click()
    const edit = page.getByRole('dialog', { name: 'Edit candidate' })
    await edit.getByLabel('Status').selectOption('baptism_ready')
    await edit.getByLabel('Progress notes').fill('Finished the class.')
    await edit.getByRole('button', { name: 'Save changes' }).click()
    await expect(edit).toBeHidden()
    expect(await saved()).toMatchObject([{ status: 'baptism_ready', progress_notes: 'Finished the class.' }])

    await page.getByLabel('Status', { exact: true }).selectOption('baptized')
    await expect(page.getByText(`Nothing matches “${name}”.`)).toBeVisible()
    await page.getByLabel('Status', { exact: true }).selectOption('baptism_ready')
    await expect(row).toContainText('Baptism ready')

    await row.getByRole('button', { name: `Delete ${name}` }).click()
    await page.getByRole('dialog', { name: 'Delete this candidate?' }).getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Candidate deleted')).toBeVisible()
    expect(await saved()).toHaveLength(0)
  })

  test('records a baptism and a confidential follow-up', async ({ page }) => {
    const place = unique('E2E River')
    const note = unique('E2E Called after the service')
    const memberId = await profileId('finance')
    const elderId = await profileId('elder')
    const name = fullName('finance')

    await page.goto('/dashboard/ministry/spiritual-service#baptisms')
    await page.getByRole('button', { name: 'Add baptism' }).first().click()
    const b = page.getByRole('dialog', { name: 'Add baptism' })
    await pickMember(page, 'Add baptism', /^Baptized/, 'finance')
    await b.getByLabel('Date').fill('2030-07-14')
    await b.getByLabel('Place').fill(place)
    await pickMember(page, 'Add baptism', /^Officiated by/, 'elder')
    await add(page, 'Add baptism')
    await expect(b).toBeHidden()
    const [baptism] = await serviceSelect<{ id: string; member_id: string; officiating_elder_id: string; baptism_date: string }[]>(
      `baptisms?select=id,member_id,officiating_elder_id,baptism_date&location=eq.${q(place)}`,
    )
    expect(baptism).toMatchObject({ member_id: memberId, officiating_elder_id: elderId, baptism_date: '2030-07-14' })
    await page.getByRole('searchbox', { name: 'Search baptisms by name' }).fill(name)
    const bRow = page.getByRole('table', { name: 'Baptisms' }).getByRole('row').filter({ hasText: place })
    await expect(bRow).toContainText(fullName('elder'))
    await bRow.getByRole('button', { name: `Delete Baptism of ${name}` }).click()
    await page.getByRole('dialog', { name: 'Delete this baptism?' }).getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Baptism deleted')).toBeVisible()
    expect(await serviceSelect<unknown[]>(`baptisms?select=id&id=eq.${baptism.id}`)).toHaveLength(0)

    await page.getByRole('tab', { name: 'Follow-ups' }).click()
    await page.getByRole('button', { name: 'Add follow-up' }).first().click()
    const f = page.getByRole('dialog', { name: 'Add follow-up' })
    await pickMember(page, 'Add follow-up', /^Member/, 'finance')
    await f.getByLabel('Type').selectOption('post_baptism')
    await f.getByLabel('Last contact').fill('2030-07-21')
    await f.getByLabel('Notes').fill(note)
    await add(page, 'Add follow-up')
    await expect(f).toBeHidden()
    const savedFollowUp = () => serviceSelect<{ id: string; follow_up_type: string; status: string }[]>(
      `spiritual_follow_ups?select=id,follow_up_type,status&notes=eq.${q(note)}`,
    )
    const [followUp] = await savedFollowUp()
    expect(followUp).toMatchObject({ follow_up_type: 'post_baptism', status: 'ongoing' })

    try {
      await page.getByRole('searchbox', { name: 'Search follow-ups by name' }).fill(name)
      const fRow = page.getByRole('table', { name: 'Follow-ups' }).getByRole('row').filter({ hasText: note })
      await expect(fRow).toContainText('Post-baptism')
      await fRow.getByRole('button', { name: `Edit Follow-up with ${name}` }).click()
      const edit = page.getByRole('dialog', { name: 'Edit follow-up' })
      await edit.getByLabel('Status').selectOption('completed')
      await edit.getByRole('button', { name: 'Save changes' }).click()
      await expect(edit).toBeHidden()
      await expect(fRow).toContainText('Completed')
      expect((await savedFollowUp())[0].status).toBe('completed')
    } finally {
      expect((await page.request.delete(`/api/spiritual-follow-ups/${followUp.id}`)).status()).toBe(200)
    }
  })
})

test.describe('spiritual service on a phone (admin)', () => {
  test.use({ storageState: authFile('admin'), viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('every tab fits the screen, with cards instead of tables', async ({ page }) => {
    const title = unique('E2E Phone class')
    const created = await page.request.post('/api/spiritual-classes', { data: { title, class_date: '2030-09-09', location: 'Phone room' } })
    expect(created.status()).toBe(201)
    const { id } = (await created.json()) as { id: string }

    try {
      await page.goto('/dashboard/ministry/spiritual-service#classes')
      await page.getByRole('searchbox', { name: 'Search classes by title or place' }).fill(title)
      await expect(page.getByRole('list', { name: 'Classes' }).getByRole('listitem').filter({ hasText: title })).toContainText('Phone room')
      await expect(page.getByRole('table', { name: 'Classes' })).toBeHidden()
      expect(await fitsWidth(page)).toBe(true)

      for (const tab of ['attendance', 'candidates', 'baptisms', 'follow-ups']) {
        await page.getByRole('tab', { name: new RegExp(`^${tab}$`, 'i') }).click()
        await page.waitForLoadState('networkidle')
        expect(await fitsWidth(page), tab).toBe(true)
      }
    } finally {
      await page.request.delete(`/api/spiritual-classes/${id}`)
    }
  })
})

test.describe('spiritual service (ministry leader)', () => {
  test.use({ storageState: authFile('ministry_leader') })

  test('may run the ministry but not read or write pastoral follow-ups', async ({ page }) => {
    const memberId = await profileId('member')
    expect((await page.request.get('/api/spiritual-follow-ups')).status()).toBe(403)
    const refused = [
      page.request.post('/api/spiritual-follow-ups', { data: { member_id: memberId, follow_up_type: 'post_salvation' } }),
      page.request.patch(`/api/spiritual-follow-ups/${ZERO}`, { data: { status: 'completed' } }),
      page.request.delete(`/api/spiritual-follow-ups/${ZERO}`),
    ]
    for (const res of await Promise.all(refused)) expect(res.status(), res.url()).toBe(403)

    // Staff tables are theirs to write.
    const title = unique('E2E Leader class')
    const created = await page.request.post('/api/spiritual-classes', { data: { title, class_date: '2030-08-01' } })
    expect(created.status()).toBe(201)
    const { id } = (await created.json()) as { id: string }
    expect((await page.request.delete(`/api/spiritual-classes/${id}`)).status()).toBe(200)

    await page.goto('/dashboard/ministry/spiritual-service#follow-ups')
    await expect(page.getByRole('tab', { name: 'Follow-ups' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByText('This list could not be loaded.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add follow-up' })).toHaveCount(0)
  })
})

test.describe('spiritual service (member)', () => {
  test.use({ storageState: authFile('member') })

  test('is refused by the write APIs and the staff-only lists', async ({ page }) => {
    const memberId = await profileId('member')
    const writes = [
      page.request.post('/api/spiritual-classes', { data: { title: 'x', class_date: '2030-01-01' } }),
      page.request.post('/api/spiritual-class-attendance', { data: { class_id: ZERO, member_id: memberId } }),
      page.request.patch(`/api/spiritual-class-attendance/${ZERO}`, { data: { attended: false } }),
      page.request.post('/api/spiritual-candidates', { data: { member_id: memberId } }),
      page.request.post('/api/baptisms', { data: { member_id: memberId, baptism_date: '2030-01-01' } }),
      page.request.delete(`/api/baptisms/${ZERO}`),
      page.request.post('/api/spiritual-follow-ups', { data: { member_id: memberId, follow_up_type: 'post_salvation' } }),
    ]
    for (const res of await Promise.all(writes)) expect(res.status(), res.url()).toBe(403)
    for (const path of ['/api/spiritual-candidates', '/api/baptisms', '/api/spiritual-follow-ups', `/api/spiritual-class-attendance?class_id=${ZERO}`]) {
      expect((await page.request.get(path)).status(), path).toBe(403)
    }
    // The class list is member-readable.
    for (const path of ['/api/spiritual-classes']) {
      expect((await page.request.get(path)).status(), path).toBe(200)
    }
  })
})
