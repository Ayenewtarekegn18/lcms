import { expect, test, type Page } from '@playwright/test'
import { authFile, serviceSelect } from '../helpers'
import { TEST_USERS } from '../users'

// Mission Ministry workspace (app/dashboard/ministry/mission): trips, participants and reports through
// their API routes. Trips are member-readable, participants and reports staff-only (RLS); staff write.

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

type Trip = { id: string; title: string; trip_date: string | null; location: string | null; status: string | null }
const tripByTitle = async (title: string) =>
  (await serviceSelect<Trip[]>(`mission_trips?select=id,title,trip_date,location,status&title=eq.${encodeURIComponent(title)}`))[0]

test.describe('mission workspace (admin)', () => {
  test.use({ storageState: authFile('admin') })

  test('plans a trip, adds a participant and a report, then deletes them', async ({ page }) => {
    const title = unique('E2E Trip')
    const place = unique('E2E Village')
    const elder = TEST_USERS.elder
    const elderId = await profileId(elder.email)
    const adminId = await profileId(TEST_USERS.admin.email)
    const elderName = `${elder.firstName} ${elder.lastName}`
    let tripId: string | undefined

    try {
      // Trips: add, then change the status.
      await page.goto('/dashboard/ministry/mission#trips')
      await expect(page.getByRole('heading', { name: 'Mission Ministry' })).toBeVisible()
      await page.getByRole('button', { name: 'Add trip' }).first().click()
      const add = page.getByRole('dialog', { name: 'Add trip' })
      await add.getByLabel('Title').fill(title)
      await add.getByLabel('Date').fill('2030-05-04')
      await add.getByLabel('Status').selectOption('ongoing')
      await add.getByLabel('Location').fill(place)
      await add.getByRole('button', { name: 'Add', exact: true }).click()
      await expect(page.getByText('Trip added')).toBeVisible({ timeout: 20_000 })
      await expect(add).toBeHidden()

      await page.getByRole('searchbox', { name: 'Search trips by title or place' }).fill(title)
      const tripRow = page.getByRole('table', { name: 'Trips' }).getByRole('row').filter({ hasText: title })
      await expect(tripRow).toContainText('Ongoing')
      const saved = await tripByTitle(title)
      expect(saved).toMatchObject({ trip_date: '2030-05-04', location: place, status: 'ongoing' })
      tripId = saved.id

      await tripRow.getByRole('button', { name: `Edit ${title}` }).click()
      const edit = page.getByRole('dialog', { name: 'Edit trip' })
      await edit.getByLabel('Status').selectOption('completed')
      await edit.getByRole('button', { name: 'Save changes' }).click()
      await expect(edit).toBeHidden()
      await expect(tripRow).toContainText('Completed')
      expect((await tripByTitle(title)).status).toBe('completed')

      // Participants: the trip comes from the trips list.
      await page.getByRole('tab', { name: 'Participants' }).click()
      await page.getByRole('button', { name: 'Add participant' }).first().click()
      const join = page.getByRole('dialog', { name: 'Add participant' })
      await join.getByRole('combobox', { name: /^Trip/ }).selectOption(tripId)
      await join.getByLabel(/^Participant/).fill(elder.lastName)
      await join.getByRole('list', { name: 'Matching members' }).getByRole('button', { name: new RegExp(elderName) }).click()
      await join.getByLabel('Role on the trip').fill('Driver')
      await join.getByRole('button', { name: 'Add', exact: true }).click()
      await expect(join).toBeHidden({ timeout: 20_000 })

      const participants = () => serviceSelect<{ id: string; role: string | null }[]>(
        `mission_trip_participants?select=id,role&trip_id=eq.${tripId}&member_id=eq.${elderId}`,
      )
      expect(await participants()).toEqual([expect.objectContaining({ role: 'Driver' })])

      // Filter the list to this trip.
      await page.getByRole('tabpanel').getByLabel('Trip', { exact: true }).selectOption(tripId)
      const participantRow = page.getByRole('table', { name: 'Participants' }).getByRole('row').filter({ hasText: elderName })
      await expect(participantRow).toContainText(title)
      await expect(participantRow).toContainText('Driver')

      await participantRow.getByRole('button', { name: `Edit ${elderName}` }).click()
      const editP = page.getByRole('dialog', { name: 'Edit participant' })
      await expect(editP.getByRole('combobox', { name: /^Trip/ })).toHaveCount(0) // the trip and the person can't change
      await editP.getByLabel('Role on the trip').fill('Team leader')
      await editP.getByRole('button', { name: 'Save changes' }).click()
      await expect(editP).toBeHidden()
      await expect(participantRow).toContainText('Team leader')
      expect(await participants()).toEqual([expect.objectContaining({ role: 'Team leader' })])

      await participantRow.getByRole('button', { name: `Remove ${elderName}` }).click()
      const confirmP = page.getByRole('dialog', { name: 'Remove this participant?' })
      await confirmP.getByRole('button', { name: 'Remove' }).click()
      await expect(confirmP).toBeHidden()
      await expect(participantRow).toHaveCount(0)
      expect(await participants()).toEqual([])

      // Reports: the author is the signed-in user.
      await page.getByRole('tab', { name: 'Reports' }).click()
      await page.getByRole('button', { name: 'Add report' }).first().click()
      const write = page.getByRole('dialog', { name: 'Add report' })
      await write.getByRole('combobox', { name: /^Trip/ }).selectOption(tripId)
      await write.getByLabel('Date').fill('2030-05-10')
      await write.getByRole('textbox', { name: /^Report/ }).fill(`${place}: 40 families visited.`)
      await write.getByRole('button', { name: 'Add', exact: true }).click()
      await expect(write).toBeHidden({ timeout: 20_000 })

      const reports = () => serviceSelect<{ id: string; report_text: string; report_date: string; created_by_id: string }[]>(
        `mission_reports?select=id,report_text,report_date,created_by_id&trip_id=eq.${tripId}`,
      )
      expect(await reports()).toEqual([expect.objectContaining({ report_date: '2030-05-10', created_by_id: adminId })])

      await page.getByRole('searchbox', { name: 'Search report text' }).fill(place)
      const reportRow = page.getByRole('table', { name: 'Reports' }).getByRole('row').filter({ hasText: place })
      await expect(reportRow).toContainText(title)
      const reportName = `Report on ${title} (10 May 2030)`
      await reportRow.getByRole('button', { name: `Edit ${reportName}` }).click()
      const editR = page.getByRole('dialog', { name: 'Edit report' })
      await editR.getByRole('textbox', { name: /^Report/ }).fill(`${place}: 42 families visited.`)
      await editR.getByRole('button', { name: 'Save changes' }).click()
      await expect(editR).toBeHidden()
      await expect(reportRow).toContainText('42 families')
      expect((await reports())[0].report_text).toBe(`${place}: 42 families visited.`)

      await reportRow.getByRole('button', { name: `Delete ${reportName}` }).click()
      await page.getByRole('dialog', { name: 'Delete this report?' }).getByRole('button', { name: 'Delete' }).click()
      await expect(page.getByText('Report deleted')).toBeVisible()
      expect(await reports()).toEqual([])

      // Delete the trip, after confirming.
      await page.getByRole('tab', { name: 'Trips' }).click()
      await page.getByRole('searchbox', { name: 'Search trips by title or place' }).fill(title)
      await page.getByRole('table', { name: 'Trips' }).getByRole('button', { name: `Delete ${title}` }).click()
      const confirm = page.getByRole('dialog', { name: 'Delete this trip?' })
      await expect(confirm).toContainText('participants and reports')
      await confirm.getByRole('button', { name: 'Delete' }).click()
      await expect(page.getByText('Trip deleted')).toBeVisible()
      expect(await serviceSelect<unknown[]>(`mission_trips?select=id&id=eq.${tripId}`)).toHaveLength(0)
      tripId = undefined
    } finally {
      if (tripId) await page.request.delete(`/api/mission-trips/${tripId}`)
    }
  })

  test('a duplicate participant is refused', async ({ page }) => {
    const created = await page.request.post('/api/mission-trips', { data: { title: unique('E2E Dup trip') } })
    expect(created.status()).toBe(201)
    const { id: tripId } = (await created.json()) as { id: string }
    try {
      const member_id = await profileId(TEST_USERS.elder.email)
      expect((await page.request.post('/api/mission-trip-participants', { data: { trip_id: tripId, member_id } })).status()).toBe(201)
      expect((await page.request.post('/api/mission-trip-participants', { data: { trip_id: tripId, member_id } })).status()).toBe(409)
      expect((await page.request.post('/api/mission-reports', { data: { trip_id: tripId, report_text: 'x', created_by_id: member_id } })).status()).toBe(400)
    } finally {
      await page.request.delete(`/api/mission-trips/${tripId}`) // participants go with it
    }
  })
})

test.describe('mission workspace on a phone (admin)', () => {
  test.use({ storageState: authFile('admin'), viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('trips and reports fit the screen, with cards instead of a table', async ({ page }) => {
    const title = unique('E2E Phone trip')
    const created = await page.request.post('/api/mission-trips', { data: { title, location: 'Phone test', trip_date: '2030-06-01' } })
    expect(created.status()).toBe(201)
    const { id } = (await created.json()) as { id: string }
    expect((await page.request.post('/api/mission-reports', { data: { trip_id: id, report_text: `${title} report` } })).status()).toBe(201)

    try {
      await page.goto('/dashboard/ministry/mission#trips')
      await page.getByRole('searchbox', { name: 'Search trips by title or place' }).fill(title)
      const cards = page.getByRole('list', { name: 'Trips' })
      await expect(cards.getByRole('listitem').filter({ hasText: title })).toContainText('Phone test')
      await expect(page.getByRole('table', { name: 'Trips' })).toBeHidden()
      expect(await fitsWidth(page)).toBe(true)

      await page.getByRole('tab', { name: 'Reports' }).click()
      await page.getByRole('searchbox', { name: 'Search report text' }).fill(title)
      await expect(page.getByRole('list', { name: 'Reports' }).getByRole('listitem').filter({ hasText: `${title} report` })).toBeVisible()
      expect(await fitsWidth(page)).toBe(true)
    } finally {
      await page.request.delete(`/api/mission-trips/${id}`)
    }
  })
})

test.describe('mission workspace (member)', () => {
  test.use({ storageState: authFile('member') })

  test('is refused by the mission write APIs and the staff-only lists', async ({ page }) => {
    const memberId = await profileId(TEST_USERS.member.email)
    const writes = [
      page.request.post('/api/mission-trips', { data: { title: unique('E2E Member trip') } }),
      page.request.patch(`/api/mission-trips/${ZERO}`, { data: { title: 'x' } }),
      page.request.delete(`/api/mission-trips/${ZERO}`),
      page.request.post('/api/mission-trip-participants', { data: { trip_id: ZERO, member_id: memberId } }),
      page.request.patch(`/api/mission-trip-participants/${ZERO}`, { data: { role: 'x' } }),
      page.request.delete(`/api/mission-trip-participants/${ZERO}`),
      page.request.post('/api/mission-reports', { data: { trip_id: ZERO, report_text: 'x' } }),
      page.request.patch(`/api/mission-reports/${ZERO}`, { data: { report_text: 'x' } }),
      page.request.delete(`/api/mission-reports/${ZERO}`),
    ]
    for (const res of await Promise.all(writes)) expect(res.status(), res.url()).toBe(403)
    expect((await page.request.get('/api/mission-trip-participants')).status()).toBe(403)
    expect((await page.request.get('/api/mission-reports')).status()).toBe(403)
    // Trips themselves are member-readable.
    expect((await page.request.get('/api/mission-trips')).status()).toBe(200)

    await page.goto('/dashboard/ministry/mission')
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
