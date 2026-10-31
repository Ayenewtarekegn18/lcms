import { expect, test } from '@playwright/test'
import { authFile, serviceSelect } from '../helpers'

// Calendar and events (guide step 2.3, finding F-19): both pages read and write only through
// /api/events, events carry a real ministry, and only PAGE_ACCESS.events (staff) may write.

/** A name no other run or test uses, without depending on the clock. */
const unique = (label: string) =>
  `${label} ${test.info().testId.slice(0, 8)}-${test.info().retry}-${Math.random().toString(36).slice(2, 8)}`

test.describe('events (admin)', () => {
  test.use({ storageState: authFile('admin') })

  test('creates an event linked to a ministry and sees it on the events page and the calendar', async ({ page }) => {
    const ministryName = unique('E2E Ministry')
    const title = unique('E2E Event')

    // A ministry of its own, so the test doesn't depend on seeded data.
    const created = await page.request.post('/api/ministries', { data: { name: ministryName } })
    expect(created.status()).toBe(201)
    const ministry = (await created.json()) as { id: string }

    await page.goto('/dashboard/events')
    await expect(page.getByRole('heading', { name: 'Events', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Schedule Event' }).click()

    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Title *').fill(title)
    // The date defaults to today in the browser's time zone; the start time to 09:00.
    await dialog.getByLabel('Start time *').fill('10:30')
    await dialog.getByLabel('Location').fill('Main hall')
    const ministrySelect = dialog.getByLabel('Ministry (optional)')
    await expect(ministrySelect.locator('option', { hasText: ministryName })).toHaveCount(1)
    await ministrySelect.selectOption({ label: ministryName })
    await dialog.getByRole('button', { name: 'Schedule Event' }).click()
    await expect(dialog).toBeHidden()

    // Today's events are upcoming (they run from the start of today).
    const upcoming = page.getByRole('table', { name: 'Upcoming events' })
    const row = upcoming.getByRole('row').filter({ hasText: title })
    await expect(row).toBeVisible()
    await expect(row).toContainText(ministryName)
    await expect(row).toContainText('Main hall')

    // Saved with the ministry, a NOT NULL start, and the signed-in user as organizer.
    const [saved] = await serviceSelect<{ ministry_id: string; start_date: string; organizer_id: string | null }[]>(
      `events?select=ministry_id,start_date,organizer_id&title=eq.${encodeURIComponent(title)}`,
    )
    expect(saved.ministry_id).toBe(ministry.id)
    expect(Date.parse(saved.start_date)).not.toBeNaN()
    expect(saved.organizer_id).toBeTruthy()

    // The calendar opens on today, with today selected.
    await page.goto('/dashboard/calendar')
    const day = page.getByTestId('selected-day')
    await expect(day).toContainText(title)
    await expect(day).toContainText(ministryName)

    // Clean up through the page, confirming in the dialog.
    await page.goto('/dashboard/events')
    await page.getByRole('button', { name: `Delete ${title}` }).click()
    const confirm = page.getByRole('dialog')
    await expect(confirm).toContainText('Delete this event?')
    await confirm.getByRole('button', { name: 'Delete event' }).click()
    await expect(page.getByRole('row').filter({ hasText: title })).toHaveCount(0)
  })

  test('the API refuses fields the server owns and a missing start', async ({ page }) => {
    const start = '2030-01-05T09:00:00+03:00'
    const owned = await page.request.post('/api/events', {
      data: { title: unique('E2E Owned'), start_date: start, organizer_id: '00000000-0000-0000-0000-000000000000' },
    })
    expect(owned.status()).toBe(400)
    expect((await page.request.post('/api/events', { data: { title: unique('E2E No start') } })).status()).toBe(400)
    expect((await page.request.post('/api/events', { data: { title: unique('E2E Old column'), start_date: start, ministry: 'Choir' } })).status()).toBe(400)
  })
})

test.describe('events (ministry leader)', () => {
  test.use({ storageState: authFile('ministry_leader') })

  test('can open the events page', async ({ page }) => {
    await page.goto('/dashboard/events')
    await expect(page).toHaveURL(/\/dashboard\/events$/)
    await expect(page.getByRole('button', { name: 'Schedule Event' })).toBeVisible()
  })
})

test.describe('events (member)', () => {
  test.use({ storageState: authFile('member') })

  test('is refused by the events write API and the events page', async ({ page }) => {
    const create = await page.request.post('/api/events', {
      data: { title: unique('E2E Member'), start_date: '2030-01-05T09:00:00+03:00' },
    })
    expect(create.status()).toBe(403)
    const id = '00000000-0000-0000-0000-000000000000'
    expect((await page.request.patch(`/api/events/${id}`, { data: { title: 'x' } })).status()).toBe(403)
    expect((await page.request.delete(`/api/events/${id}`)).status()).toBe(403)

    await page.goto('/dashboard/events')
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('can read the calendar but gets no add button', async ({ page }) => {
    await page.goto('/dashboard/calendar')
    await expect(page.getByRole('heading', { name: 'Calendar & Events' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add Event' })).toHaveCount(0)
    expect((await page.request.get('/api/events')).status()).toBe(200)
  })
})
