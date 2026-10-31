import { expect, test } from '@playwright/test'
import { SUPABASE_URL, authFile, serviceSelect } from '../helpers'
import { TEST_USERS } from '../users'

// Attendance per event (remediation step 2.5, finding F-21): staff take attendance through /api/attendance,
// members are refused, and the sidebar shows the page only to the roles in PAGE_ACCESS.attendance.

/** Write straight to PostgREST as service_role (test stack only), to set up an event of this test's own. */
async function serviceWrite(method: 'POST' | 'DELETE', path: string, body?: unknown) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY missing: run npm run local:start first')
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${await res.text()}`)
  return res.json() as Promise<{ id: string }[]>
}

const profileId = async (email: string) =>
  (await serviceSelect<{ id: string }[]>(`profiles?select=id&email=eq.${encodeURIComponent(email)}`))[0].id

test.describe('attendance (ministry_leader)', () => {
  test.use({ storageState: authFile('ministry_leader') })

  let eventId = ''
  let title = ''

  test.beforeEach(async () => {
    title = `Attendance e2e ${test.info().testId}-${test.info().retry}`
    const [event] = await serviceWrite('POST', 'events', {
      title,
      event_type: 'service',
      start_date: new Date().toISOString(),
      organizer_id: await profileId(TEST_USERS.admin.email),
    })
    eventId = event.id
  })

  test.afterEach(async () => {
    // attendance_records.event_id cascades, so this removes the test's records too
    if (eventId) await serviceWrite('DELETE', `events?id=eq.${eventId}`)
  })

  test('records attendance for an event and sees the count', async ({ page }) => {
    await page.goto('/dashboard/attendance')
    await expect(page.getByRole('heading', { name: 'Attendance', level: 1 })).toBeVisible()

    await page.getByRole('combobox', { name: 'Event' }).click()
    await page.getByRole('option', { name: new RegExp(title) }).click()
    await expect(page.getByTestId('count-total')).toHaveText('0')

    const { firstName, lastName } = TEST_USERS.member
    await page.getByLabel('Search members').fill(firstName)
    const statuses = page.getByRole('group', { name: `Status for ${firstName} ${lastName}` })
    await statuses.getByRole('button', { name: 'Present' }).click()
    await page.getByRole('button', { name: 'Save attendance' }).click()

    await expect(page.getByText(/Attendance saved for 1 member/)).toBeVisible()
    await expect(page.getByTestId('count-total')).toHaveText('1')
    await expect(page.getByTestId('count-present')).toHaveText('1')
    await expect(page.getByTestId('record-row').filter({ hasText: `${firstName} ${lastName}` })).toContainText('Present')

    // saving again changes the record instead of adding one
    await statuses.getByRole('button', { name: 'Late' }).click()
    await page.getByRole('button', { name: 'Save attendance' }).click()
    await expect(page.getByTestId('count-late')).toHaveText('1')
    await expect(page.getByTestId('count-present')).toHaveText('0')
    await expect(page.getByTestId('count-total')).toHaveText('1')

    const saved = await serviceSelect<{ status: string; recorded_by_id: string }[]>(
      `attendance_records?select=status,recorded_by_id&event_id=eq.${eventId}`,
    )
    expect(saved).toEqual([{ status: 'late', recorded_by_id: await profileId(TEST_USERS.ministry_leader.email) }])
  })

  test('the API refuses a status it does not know and a server-owned field', async ({ page }) => {
    const request = page.request
    const member_id = await profileId(TEST_USERS.member.email)
    const bad = await request.post('/api/attendance', { data: { event_id: eventId, records: [{ member_id, status: 'excused' }] } })
    expect(bad.status()).toBe(400)
    const owned = await request.post('/api/attendance', {
      data: { event_id: eventId, records: [{ member_id, status: 'present' }], recorded_by_id: member_id },
    })
    expect(owned.status()).toBe(400)
  })
})

test.describe('attendance (member)', () => {
  test.use({ storageState: authFile('member') })

  test('is refused by the attendance API', async ({ page }) => {
    const request = page.request
    expect((await request.get('/api/attendance')).status()).toBe(403)
    expect((await request.get('/api/attendance/events')).status()).toBe(403)
    const member_id = await profileId(TEST_USERS.member.email)
    const post = await request.post('/api/attendance', {
      data: { event_id: '00000000-0000-4000-8000-000000000000', records: [{ member_id, status: 'present' }] },
    })
    expect(post.status()).toBe(403)
  })

  test('does not see Attendance in the sidebar', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.locator('nav a[href="/dashboard/members"], nav a[href="/dashboard/settings"]').first()).toBeVisible()
    await expect(page.locator('nav a[href="/dashboard/attendance"]')).toHaveCount(0)
  })
})

for (const role of ['admin', 'elder', 'ministry_leader'] as const) {
  test.describe(`sidebar (${role})`, () => {
    test.use({ storageState: authFile(role) })
    test('shows Attendance', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(page.locator('nav a[href="/dashboard/attendance"]')).toBeVisible()
    })
  })
}
