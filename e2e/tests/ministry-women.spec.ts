import { randomUUID } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'
import { authFile, serviceSelect } from '../helpers'

// Women's Ministry workspace (docs/MINISTRY_WORKSPACES.md): meetings (with minutes), activities and
// trainings read and write through their API routes; staff write, members only read.

const unique = (label: string) =>
  `${label} ${test.info().testId.slice(0, 6)}${test.info().retry}-${randomUUID().slice(0, 8)}`

const ZERO = '00000000-0000-0000-0000-000000000000'
const q = encodeURIComponent

const fitsWidth = (page: Page) =>
  page.evaluate(() => {
    const main = document.getElementById('main-content')
    return document.documentElement.scrollWidth <= window.innerWidth + 1 && !!main && main.scrollWidth <= main.clientWidth + 1
  })

const add = (page: Page, dialogName: string) =>
  page.getByRole('dialog', { name: dialogName }).getByRole('button', { name: 'Add', exact: true }).click()

test.describe("women's ministry (admin)", () => {
  test.use({ storageState: authFile('admin') })

  test('adds, edits and deletes a meeting with its minutes', async ({ page }) => {
    const title = unique('E2E Fellowship')

    await page.goto('/dashboard/ministry/women')
    await expect(page.getByRole('heading', { name: "Women's Ministry" })).toBeVisible()
    await page.getByRole('tab', { name: 'Meetings' }).click()
    await page.getByRole('button', { name: 'Add meeting' }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Add meeting' })
    await dialog.getByLabel('Title').fill(title)
    await dialog.getByLabel('Date').fill('2030-03-08')
    await dialog.getByLabel('Time').fill('18:30')
    await dialog.getByLabel('Place').fill('Fellowship hall')
    await dialog.getByLabel('Minutes').fill('Opened in prayer.')
    await add(page, 'Add meeting')
    await expect(dialog).toBeHidden()

    await page.getByRole('searchbox', { name: 'Search meetings by title or place' }).fill(title)
    const row = page.getByRole('table', { name: 'Meetings' }).getByRole('row').filter({ hasText: title })
    await expect(row).toContainText('18:30')
    await expect(row).toContainText('Minutes recorded')
    const saved = () => serviceSelect<{ id: string; meeting_date: string; meeting_time: string; attendees_count: number; minutes_text: string }[]>(
      `women_meetings?select=id,meeting_date,meeting_time,attendees_count,minutes_text&title=eq.${q(title)}`,
    )
    const [meeting] = await saved()
    expect(meeting).toMatchObject({ meeting_date: '2030-03-08', meeting_time: '18:30:00', attendees_count: 0, minutes_text: 'Opened in prayer.' })

    await row.getByRole('button', { name: `Edit ${title}` }).click()
    const edit = page.getByRole('dialog', { name: 'Edit meeting' })
    await edit.getByLabel('Attended').fill('27')
    await edit.getByLabel('Minutes').fill('Opened in prayer. Planned the bazaar.')
    await edit.getByRole('button', { name: 'Save changes' }).click()
    await expect(edit).toBeHidden()
    await expect(row).toContainText('27')
    expect((await saved())[0]).toMatchObject({ attendees_count: 27, minutes_text: 'Opened in prayer. Planned the bazaar.' })

    await row.getByRole('button', { name: `Delete ${title}` }).click()
    await page.getByRole('dialog', { name: 'Delete this meeting?' }).getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Meeting deleted')).toBeVisible()
    expect(await saved()).toHaveLength(0)
  })

  test('adds an activity and a training', async ({ page }) => {
    const activity = unique('E2E Hospital visit')
    const training = unique('E2E Workshop')

    await page.goto('/dashboard/ministry/women#activities')
    await page.getByRole('button', { name: 'Add activity' }).first().click()
    const a = page.getByRole('dialog', { name: 'Add activity' })
    await a.getByLabel('Title').fill(activity)
    await a.getByLabel('Date').fill('2030-04-12')
    await a.getByLabel('Status').selectOption('planned')
    await a.getByLabel('Volunteers').fill('6')
    await add(page, 'Add activity')
    await expect(a).toBeHidden()
    await page.getByRole('searchbox', { name: 'Search activities' }).fill(activity)
    await expect(page.getByRole('table', { name: 'Activities' }).getByRole('row').filter({ hasText: activity })).toContainText('Planned')
    const [act] = await serviceSelect<{ id: string; status: string; volunteers_count: number }[]>(
      `women_activities?select=id,status,volunteers_count&title=eq.${q(activity)}`,
    )
    expect(act).toMatchObject({ status: 'planned', volunteers_count: 6 })
    expect((await page.request.delete(`/api/women-activities/${act.id}`)).status()).toBe(200)

    await page.getByRole('tab', { name: 'Trainings' }).click()
    await page.getByRole('button', { name: 'Add training' }).first().click()
    const t = page.getByRole('dialog', { name: 'Add training' })
    await t.getByLabel('Title').fill(training)
    await t.getByLabel('Instructor').fill('Sister Almaz')
    await t.getByLabel('Description').fill('Leading small groups.')
    await add(page, 'Add training')
    await expect(t).toBeHidden()
    await page.getByRole('searchbox', { name: 'Search by title or instructor' }).fill(training)
    await expect(page.getByRole('table', { name: 'Trainings' }).getByRole('row').filter({ hasText: training })).toContainText('Sister Almaz')
    const [tr] = await serviceSelect<{ id: string; registered_count: number; description: string }[]>(
      `women_trainings?select=id,registered_count,description&title=eq.${q(training)}`,
    )
    expect(tr).toMatchObject({ registered_count: 0, description: 'Leading small groups.' })
    expect((await page.request.delete(`/api/women-trainings/${tr.id}`)).status()).toBe(200)
  })
})

test.describe("women's ministry on a phone (admin)", () => {
  test.use({ storageState: authFile('admin'), viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('the workspace fits the screen, with cards instead of tables', async ({ page }) => {
    const title = unique('E2E Phone meeting')
    const created = await page.request.post('/api/women-meetings', { data: { title, meeting_date: '2030-09-09', location: 'Phone hall' } })
    expect(created.status()).toBe(201)
    const { id } = (await created.json()) as { id: string }

    try {
      await page.goto('/dashboard/ministry/women#meetings')
      await page.getByRole('searchbox', { name: 'Search meetings by title or place' }).fill(title)
      const cards = page.getByRole('list', { name: 'Meetings' })
      await expect(cards.getByRole('listitem').filter({ hasText: title })).toContainText('Phone hall')
      await expect(page.getByRole('table', { name: 'Meetings' })).toBeHidden()
      expect(await fitsWidth(page)).toBe(true)

    } finally {
      await page.request.delete(`/api/women-meetings/${id}`)
    }
  })
})

test.describe("women's ministry (member)", () => {
  test.use({ storageState: authFile('member') })

  test('is refused by the write APIs but may read the lists', async ({ page }) => {
    const writes = [
      page.request.post('/api/women-meetings', { data: { title: unique('E2E Member meeting'), meeting_date: '2030-01-01' } }),
      page.request.post('/api/women-activities', { data: { title: unique('E2E Member activity') } }),
      page.request.post('/api/women-trainings', { data: { title: unique('E2E Member training') } }),
      page.request.patch(`/api/women-meetings/${ZERO}`, { data: { title: 'x' } }),
      page.request.delete(`/api/women-trainings/${ZERO}`),
    ]
    for (const res of await Promise.all(writes)) expect(res.status(), res.url()).toBe(403)
    // Meetings, activities and trainings are member-readable.
    for (const path of ['/api/women-meetings', '/api/women-activities', '/api/women-trainings']) {
      expect((await page.request.get(path)).status(), path).toBe(200)
    }
  })
})
