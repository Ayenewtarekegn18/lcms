import { randomUUID } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'
import { authFile, serviceSelect } from '../helpers'
import { TEST_USERS } from '../users'

// Charity workspace (docs/MINISTRY_WORKSPACES.md): Aid requests and Distributions are confidential
// (RLS: admin and elder only), and so are their routes. Approving or rejecting a request records the
// signed-in user as the reviewer on the server.

const unique = (label: string) =>
  `${label} ${test.info().testId.slice(0, 6)}${test.info().retry}-${randomUUID().slice(0, 8)}`

const ZERO = '00000000-0000-0000-0000-000000000000'
const count = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

const fitsWidth = (page: Page) =>
  page.evaluate(() => {
    const main = document.getElementById('main-content')
    return document.documentElement.scrollWidth <= window.innerWidth + 1 && !!main && main.scrollWidth <= main.clientWidth + 1
  })

type AidRequest = { id: string; member_id: string; amount_requested: number | null; status: string; reviewed_by_id: string | null; reviewed_at: string | null }
type Distribution = { id: string; request_id: string; amount: number; distributed_date: string; notes: string | null }
type Totals = { requested: number; requests: number; pending: number; paid: number; distributions: number }

const savedRequest = async (reason: string) =>
  (await serviceSelect<AidRequest[]>(`charity_aid_requests?select=id,member_id,amount_requested,status,reviewed_by_id,reviewed_at&reason=eq.${encodeURIComponent(reason)}`))[0]
const savedDistributions = (requestId: string) =>
  serviceSelect<Distribution[]>(`charity_distributions?select=id,request_id,amount,distributed_date,notes&request_id=eq.${requestId}`)
const profileId = async (email: string) =>
  (await serviceSelect<{ id: string }[]>(`profiles?select=id&email=eq.${encodeURIComponent(email)}`))[0].id

test.describe('charity workspace (admin)', () => {
  test.use({ storageState: authFile('admin') })

  test('records a request, approves it, pays it out and deletes both after confirming', async ({ page }) => {
    const reason = unique('E2E Rent help')
    const note = unique('E2E Cash')
    const member = TEST_USERS.member
    const memberName = `${member.firstName} ${member.lastName}`
    const totals = async () => (await (await page.request.get('/api/charity-aid-requests/summary')).json()) as Totals
    const before = await totals()

    await page.goto('/dashboard/ministry/charity#aid-requests')
    await expect(page.getByRole('heading', { name: 'Charity Ministry', exact: true })).toBeVisible()
    const figures = page.getByRole('region', { name: 'Charity totals' })
    await expect(figures).toContainText('Requested')
    await expect(figures).toContainText('Paid out')

    // Add a request: it starts pending, without a reviewer.
    await page.getByRole('button', { name: 'Add aid request' }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Add aid request' })
    await dialog.getByLabel('Member').fill(member.lastName)
    await dialog.getByRole('list', { name: 'Matching members' }).getByRole('button', { name: new RegExp(memberName) }).click()
    await dialog.getByLabel('Request date').fill('2030-03-03')
    await dialog.getByLabel('Amount (ETB)').fill('1500.50')
    await dialog.getByLabel('Reason').fill(reason)
    await dialog.getByRole('button', { name: 'Add', exact: true }).click()
    await expect(page.getByText('Aid request added')).toBeVisible({ timeout: 20_000 })
    await expect(dialog).toBeHidden()

    const request = await savedRequest(reason)
    expect(request).toMatchObject({ member_id: await profileId(member.email), amount_requested: 1500.5, status: 'pending', reviewed_by_id: null, reviewed_at: null })
    expect((await totals()).requested).toBeCloseTo(before.requested + 1500.5, 2)
    await expect(figures).toContainText(count(before.requests + 1, 'request'))

    // A pending request can't be paid out.
    const early = await page.request.post('/api/charity-distributions', { data: { request_id: request.id, distributed_date: '2030-03-04', amount: 10 } })
    expect(early.status()).toBe(400)

    // Approve: the server records who reviewed it and when.
    const row = page.getByRole('table', { name: 'Aid requests' }).getByRole('row').filter({ hasText: reason })
    await expect(row).toContainText('Pending')
    await expect(row).toContainText('ETB 1,500.50')
    await row.getByRole('button', { name: /^Edit / }).click()
    const edit = page.getByRole('dialog', { name: 'Edit aid request' })
    await edit.getByLabel('Status').selectOption('approved')
    await edit.getByRole('button', { name: 'Save changes' }).click()
    await expect(edit).toBeHidden()
    await expect(row).toContainText('Approved')
    await expect(row).toContainText(`${TEST_USERS.admin.firstName} ${TEST_USERS.admin.lastName}`)
    const approved = await savedRequest(reason)
    expect(approved).toMatchObject({ status: 'approved', reviewed_by_id: await profileId(TEST_USERS.admin.email) })
    expect(Date.now() - Date.parse(approved.reviewed_at ?? '')).toBeLessThan(5 * 60_000)

    // Pay out part of it under Distributions.
    await page.getByRole('tab', { name: 'Distributions' }).click()
    await page.getByRole('button', { name: 'Add distribution' }).first().click()
    const pay = page.getByRole('dialog', { name: 'Add distribution' })
    await pay.getByLabel('Aid request').selectOption(request.id)
    await pay.getByLabel('Date').fill('2030-03-05')
    await pay.getByLabel('Amount (ETB)').fill('500')
    await pay.getByLabel('Notes').fill(note)
    await pay.getByRole('button', { name: 'Add', exact: true }).click()
    await expect(page.getByText('Distribution added')).toBeVisible({ timeout: 20_000 })
    await expect(pay).toBeHidden()

    const [paid] = await savedDistributions(request.id)
    expect(paid).toMatchObject({ amount: 500, distributed_date: '2030-03-05', notes: note })
    expect((await totals()).paid).toBeCloseTo(before.paid + 500, 2)
    await expect(page.getByRole('region', { name: 'Charity totals' })).toContainText(count(before.distributions + 1, 'distribution'))

    await page.getByRole('searchbox', { name: 'Search notes' }).fill(note)
    const payRow = page.getByRole('table', { name: 'Distributions' }).getByRole('row').filter({ hasText: note })
    await expect(payRow).toContainText(memberName)
    await expect(payRow).toContainText('ETB 500.00')

    // Change the amount, then delete it after confirming.
    await payRow.getByRole('button', { name: /^Edit / }).click()
    const payEdit = page.getByRole('dialog', { name: 'Edit distribution' })
    await payEdit.getByLabel('Amount (ETB)').fill('450')
    await payEdit.getByRole('button', { name: 'Save changes' }).click()
    await expect(payEdit).toBeHidden()
    await expect(payRow).toContainText('ETB 450.00')
    expect((await savedDistributions(request.id))[0].amount).toBe(450)

    await payRow.getByRole('button', { name: /^Delete / }).click()
    const confirmPay = page.getByRole('dialog', { name: 'Delete this distribution?' })
    await confirmPay.getByRole('button', { name: 'Cancel' }).click()
    expect(await savedDistributions(request.id)).toHaveLength(1)
    await payRow.getByRole('button', { name: /^Delete / }).click()
    await page.getByRole('dialog', { name: 'Delete this distribution?' }).getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Distribution deleted')).toBeVisible()
    expect(await savedDistributions(request.id)).toHaveLength(0)

    // Delete the request.
    await page.getByRole('tab', { name: 'Aid requests' }).click()
    await row.getByRole('button', { name: /^Delete / }).click()
    const confirm = page.getByRole('dialog', { name: 'Delete this aid request?' })
    await expect(confirm).toContainText(memberName)
    await confirm.getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Aid request deleted')).toBeVisible()
    await expect(row).toHaveCount(0)
    expect(await savedRequest(reason)).toBeUndefined()
  })

  test('rejecting stamps the reviewer, back to pending clears it; review columns are never accepted', async ({ page }) => {
    const reason = unique('E2E Reject')
    const memberId = await profileId(TEST_USERS.member.email)
    const created = await page.request.post('/api/charity-aid-requests', { data: { member_id: memberId, reason, amount_requested: 20 } })
    expect(created.status()).toBe(201)
    const { id } = (await created.json()) as { id: string }
    try {
      expect((await page.request.patch(`/api/charity-aid-requests/${id}`, { data: { status: 'rejected' } })).status()).toBe(200)
      expect(await savedRequest(reason)).toMatchObject({ status: 'rejected', reviewed_by_id: await profileId(TEST_USERS.admin.email) })
      expect((await page.request.patch(`/api/charity-aid-requests/${id}`, { data: { status: 'pending' } })).status()).toBe(200)
      expect(await savedRequest(reason)).toMatchObject({ status: 'pending', reviewed_by_id: null, reviewed_at: null })

      const forged = [
        page.request.post('/api/charity-aid-requests', { data: { member_id: memberId, reviewed_by_id: memberId } }),
        page.request.patch(`/api/charity-aid-requests/${id}`, { data: { reviewed_at: '2020-01-01T00:00:00Z' } }),
        page.request.patch(`/api/charity-aid-requests/${id}`, { data: { status: 'closed' } }),
      ]
      for (const res of await Promise.all(forged)) expect(res.status(), res.url()).toBe(400)
    } finally {
      await page.request.delete(`/api/charity-aid-requests/${id}`)
    }
  })
})

test.describe('charity workspace on a phone (admin)', () => {
  test.use({ storageState: authFile('admin'), viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('the requests and totals fit the screen, with cards instead of a table', async ({ page }) => {
    const reason = unique('E2E Phone aid')
    const memberId = await profileId(TEST_USERS.member.email)
    const created = await page.request.post('/api/charity-aid-requests', { data: { member_id: memberId, reason, amount_requested: 98765432.1 } })
    expect(created.status()).toBe(201)
    const { id } = (await created.json()) as { id: string }
    try {
      await page.goto('/dashboard/ministry/charity#aid-requests')
      await expect(page.getByRole('region', { name: 'Charity totals' })).toContainText('ETB')
      const card = page.getByRole('list', { name: 'Aid requests' }).getByRole('listitem').filter({ hasText: 'ETB 98,765,432.10' })
      await expect(card.first()).toBeVisible()
      await expect(page.getByRole('table', { name: 'Aid requests' })).toBeHidden()
      expect(await fitsWidth(page)).toBe(true)

      await page.getByRole('tab', { name: 'Distributions' }).click()
      await expect(page.getByRole('region', { name: 'Charity totals' })).toBeVisible()
      expect(await fitsWidth(page)).toBe(true)
    } finally {
      await page.request.delete(`/api/charity-aid-requests/${id}`)
    }
  })
})

const refusedEverything = (page: Page) => [
  page.request.get('/api/charity-aid-requests'),
  page.request.get('/api/charity-aid-requests/summary'),
  page.request.get('/api/charity-distributions'),
  page.request.post('/api/charity-aid-requests', { data: { member_id: ZERO } }),
  page.request.patch(`/api/charity-aid-requests/${ZERO}`, { data: { status: 'approved' } }),
  page.request.delete(`/api/charity-aid-requests/${ZERO}`),
  page.request.post('/api/charity-distributions', { data: { request_id: ZERO, distributed_date: '2030-01-01', amount: 1 } }),
  page.request.patch(`/api/charity-distributions/${ZERO}`, { data: { amount: 1 } }),
  page.request.delete(`/api/charity-distributions/${ZERO}`),
]

test.describe('charity workspace (ministry leader)', () => {
  test.use({ storageState: authFile('ministry_leader') })

  test('may open the workspace but not the confidential tabs or their APIs', async ({ page }) => {
    for (const res of await Promise.all(refusedEverything(page))) expect(res.status(), res.url()).toBe(403)

    await page.goto('/dashboard/ministry/charity#aid-requests')
    await expect(page.getByRole('heading', { name: 'Charity Ministry', exact: true })).toBeVisible()
    await expect(page.getByText('Aid requests are confidential.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add aid request' })).toHaveCount(0)
    await expect(page.getByRole('region', { name: 'Charity totals' })).toHaveCount(0)
  })
})

test.describe('charity workspace (member)', () => {
  test.use({ storageState: authFile('member') })

  test('is refused by the charity APIs and the page', async ({ page }) => {
    for (const res of await Promise.all(refusedEverything(page))) expect(res.status(), res.url()).toBe(403)
    await page.goto('/dashboard/ministry/charity')
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
