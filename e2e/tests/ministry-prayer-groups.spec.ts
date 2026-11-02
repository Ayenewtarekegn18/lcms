import { expect, test, type Page } from '@playwright/test'
import { authFile, serviceSelect } from '../helpers'
import { TEST_USERS } from '../users'

// Prayer Groups workspace (app/dashboard/ministry/prayer-groups): groups are member-readable and staff
// write them; prayer requests are confidential (RLS: admin and elder see and manage all of them, anyone
// else may submit a request and see only their own).

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

type Group = { id: string; name: string; meeting_schedule: string | null; description: string | null }
type Request = { id: string; group_id: string | null; status: string | null; requested_by_id: string | null; request_text: string }
const groupByName = async (name: string) =>
  (await serviceSelect<Group[]>(`prayer_groups?select=id,name,meeting_schedule,description&name=eq.${encodeURIComponent(name)}`))[0]
const requestsWith = (text: string) =>
  serviceSelect<Request[]>(`prayer_requests?select=id,group_id,status,requested_by_id,request_text&request_text=eq.${encodeURIComponent(text)}`)

test.describe('prayer groups workspace (admin)', () => {
  test.use({ storageState: authFile('admin') })

  test('adds a group and a request, answers the request, then deletes both', async ({ page }) => {
    const name = unique('E2E Prayer group')
    const text = unique('E2E Pray for')
    const adminId = await profileId(TEST_USERS.admin.email)
    let groupId: string | undefined

    try {
      await page.goto('/dashboard/ministry/prayer-groups#groups')
      await expect(page.getByRole('heading', { name: 'Prayer Groups' })).toBeVisible()
      await page.getByRole('button', { name: 'Add prayer group' }).first().click()
      const add = page.getByRole('dialog', { name: 'Add prayer group' })
      await add.getByLabel('Name').fill(name)
      await add.getByLabel('Meets').fill('Wednesdays 6 PM')
      await add.getByRole('button', { name: 'Add', exact: true }).click()
      await expect(page.getByText('Prayer group added')).toBeVisible({ timeout: 20_000 })
      await expect(add).toBeHidden()

      await page.getByRole('searchbox', { name: 'Search groups' }).fill(name)
      const groupRow = page.getByRole('table', { name: 'Groups' }).getByRole('row').filter({ hasText: name })
      await expect(groupRow).toContainText('Wednesdays 6 PM')
      groupId = (await groupByName(name)).id

      await groupRow.getByRole('button', { name: `Edit ${name}` }).click()
      const edit = page.getByRole('dialog', { name: 'Edit prayer group' })
      await edit.getByLabel('Meets').fill('Fridays 7 AM')
      await edit.getByLabel('Description').fill('Morning intercession')
      await edit.getByRole('button', { name: 'Save changes' }).click()
      await expect(edit).toBeHidden()
      await expect(groupRow).toContainText('Fridays 7 AM')
      expect(await groupByName(name)).toMatchObject({ meeting_schedule: 'Fridays 7 AM', description: 'Morning intercession' })

      // A request for this group: open by default, the requester is the signed-in user.
      await page.getByRole('tab', { name: 'Prayer requests' }).click()
      await expect(page.getByText('Confidential: only admins and elders see these requests.')).toBeVisible()
      await page.getByRole('button', { name: 'Add prayer request' }).first().click()
      const ask = page.getByRole('dialog', { name: 'Add prayer request' })
      await ask.getByLabel('Request').fill(text)
      await ask.getByLabel('Prayer group').selectOption(groupId)
      await expect(ask.getByLabel('Status')).toHaveValue('open')
      await ask.getByRole('button', { name: 'Add', exact: true }).click()
      await expect(ask).toBeHidden({ timeout: 20_000 })
      expect(await requestsWith(text)).toEqual([expect.objectContaining({ group_id: groupId, status: 'open', requested_by_id: adminId })])

      await page.getByRole('searchbox', { name: 'Search requests' }).fill(text)
      const requestRow = page.getByRole('table', { name: 'Prayer requests' }).getByRole('row').filter({ hasText: text })
      await expect(requestRow).toContainText(name)
      await expect(requestRow).toContainText('Open')

      await requestRow.getByRole('button', { name: `Edit ${text}` }).click()
      const editR = page.getByRole('dialog', { name: 'Edit prayer request' })
      await editR.getByLabel('Status').selectOption('answered')
      await editR.getByRole('button', { name: 'Save changes' }).click()
      await expect(editR).toBeHidden()
      await expect(requestRow).toContainText('Answered')
      expect((await requestsWith(text))[0].status).toBe('answered')

      await requestRow.getByRole('button', { name: `Delete ${text}` }).click()
      const confirmR = page.getByRole('dialog', { name: 'Delete this prayer request?' })
      await confirmR.getByRole('button', { name: 'Cancel' }).click()
      expect(await requestsWith(text)).toHaveLength(1)
      await requestRow.getByRole('button', { name: `Delete ${text}` }).click()
      await page.getByRole('dialog', { name: 'Delete this prayer request?' }).getByRole('button', { name: 'Delete' }).click()
      await expect(page.getByText('Prayer request deleted')).toBeVisible()
      expect(await requestsWith(text)).toHaveLength(0)

      // Delete the group.
      await page.getByRole('tab', { name: 'Groups' }).click()
      await page.getByRole('searchbox', { name: 'Search groups' }).fill(name)
      await page.getByRole('table', { name: 'Groups' }).getByRole('button', { name: `Delete ${name}` }).click()
      await page.getByRole('dialog', { name: 'Delete this prayer group?' }).getByRole('button', { name: 'Delete' }).click()
      await expect(page.getByText('Prayer group deleted')).toBeVisible()
      expect(await serviceSelect<unknown[]>(`prayer_groups?select=id&id=eq.${groupId}`)).toHaveLength(0)
      groupId = undefined
    } finally {
      for (const r of await requestsWith(text)) await page.request.delete(`/api/prayer-requests/${r.id}`)
      if (groupId) await page.request.delete(`/api/prayer-groups/${groupId}`)
    }
  })
})

test.describe('prayer groups workspace on a phone (admin)', () => {
  test.use({ storageState: authFile('admin'), viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('groups and requests fit the screen, with cards instead of a table', async ({ page }) => {
    const name = unique('E2E Phone group')
    const created = await page.request.post('/api/prayer-groups', { data: { name, meeting_schedule: 'Phone test' } })
    expect(created.status()).toBe(201)
    const { id } = (await created.json()) as { id: string }
    const asked = await page.request.post('/api/prayer-requests', { data: { request_text: `${name} request`, group_id: id } })
    expect(asked.status()).toBe(201)
    const { id: requestId } = (await asked.json()) as { id: string }

    try {
      await page.goto('/dashboard/ministry/prayer-groups#groups')
      await page.getByRole('searchbox', { name: 'Search groups' }).fill(name)
      await expect(page.getByRole('list', { name: 'Groups' }).getByRole('listitem').filter({ hasText: name })).toContainText('Phone test')
      await expect(page.getByRole('table', { name: 'Groups' })).toBeHidden()
      expect(await fitsWidth(page)).toBe(true)

      await page.getByRole('tab', { name: 'Prayer requests' }).click()
      await page.getByRole('searchbox', { name: 'Search requests' }).fill(`${name} request`)
      await expect(page.getByRole('list', { name: 'Prayer requests' }).getByRole('listitem').filter({ hasText: `${name} request` })).toBeVisible()
      expect(await fitsWidth(page)).toBe(true)
    } finally {
      await page.request.delete(`/api/prayer-requests/${requestId}`)
      await page.request.delete(`/api/prayer-groups/${id}`)
    }
  })
})

test.describe('prayer requests are confidential (ministry leader)', () => {
  test.use({ storageState: authFile('ministry_leader') })

  test('sees only their own requests and may not change or delete any', async ({ page, browser }) => {
    const admin = await browser.newContext({ storageState: authFile('admin') })
    const secret = unique('E2E Confidential')
    const created = await admin.request.post('/api/prayer-requests', { data: { request_text: secret } })
    expect(created.status()).toBe(201)
    const { id } = (await created.json()) as { id: string }

    try {
      const listed = (await (await page.request.get(`/api/prayer-requests?search=${encodeURIComponent(secret)}`)).json()) as unknown[]
      expect(listed).toEqual([])
      expect((await page.request.patch(`/api/prayer-requests/${id}`, { data: { status: 'closed' } })).status()).toBe(403)
      expect((await page.request.delete(`/api/prayer-requests/${id}`)).status()).toBe(403)
      expect((await requestsWith(secret))[0].status).toBe('open')

      // Groups are staff-written: a leader may add one.
      const group = await page.request.post('/api/prayer-groups', { data: { name: unique('E2E Leader group') } })
      expect(group.status()).toBe(201)
      expect((await page.request.delete(`/api/prayer-groups/${((await group.json()) as { id: string }).id}`)).status()).toBe(200)

      await page.goto('/dashboard/ministry/prayer-groups#requests')
      await expect(page.getByText(/You only see requests you submitted/)).toBeVisible()
      await expect(page.getByRole('button', { name: 'Add prayer request' })).toHaveCount(0)
    } finally {
      await admin.request.delete(`/api/prayer-requests/${id}`)
      await admin.close()
    }
  })
})

test.describe('prayer groups workspace (member)', () => {
  test.use({ storageState: authFile('member') })

  test('may submit and read their own request, nothing else', async ({ page }) => {
    const memberId = await profileId(TEST_USERS.member.email)
    const writes = [
      page.request.post('/api/prayer-groups', { data: { name: unique('E2E Member group') } }),
      page.request.patch(`/api/prayer-groups/${ZERO}`, { data: { name: 'x' } }),
      page.request.delete(`/api/prayer-groups/${ZERO}`),
      page.request.patch(`/api/prayer-requests/${ZERO}`, { data: { status: 'closed' } }),
      page.request.delete(`/api/prayer-requests/${ZERO}`),
    ]
    for (const res of await Promise.all(writes)) expect(res.status(), res.url()).toBe(403)
    expect((await page.request.get('/api/prayer-groups')).status()).toBe(200)

    // RLS lets a member submit their own request: the requester is always them.
    const text = unique('E2E Member request')
    expect((await page.request.post('/api/prayer-requests', { data: { request_text: text, requested_by_id: ZERO } })).status()).toBe(400)
    const created = await page.request.post('/api/prayer-requests', { data: { request_text: text } })
    expect(created.status()).toBe(201)
    const { id } = (await created.json()) as { id: string }
    try {
      expect(await requestsWith(text)).toEqual([expect.objectContaining({ requested_by_id: memberId, status: 'open' })])
      const mine = (await (await page.request.get('/api/prayer-requests')).json()) as Request[]
      expect(mine.map((r) => r.id)).toContain(id)
      expect(mine.every((r) => r.requested_by_id === memberId)).toBe(true)
      expect((await page.request.delete(`/api/prayer-requests/${id}`)).status()).toBe(403)
    } finally {
      const admin = await page.context().browser()!.newContext({ storageState: authFile('admin') })
      await admin.request.delete(`/api/prayer-requests/${id}`)
      await admin.close()
    }

    await page.goto('/dashboard/ministry/prayer-groups')
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
