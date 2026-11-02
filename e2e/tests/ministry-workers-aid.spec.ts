import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { authFile, serviceSelect } from '../helpers'
import { TEST_USERS } from '../users'

// Monthly Workers Aid workspace: beneficiaries and their payments are confidential (RLS: admin and elder
// only). Totals per month and "record this month's payments" come from /api/workers-aid-disbursements/months.

const token = () => Math.random().toString(36).slice(2, 8)
const ZERO = '00000000-0000-0000-0000-000000000000'

const fitsWidth = (page: Page) =>
  page.evaluate(() => {
    const main = document.getElementById('main-content')
    return document.documentElement.scrollWidth <= window.innerWidth + 1 && !!main && main.scrollWidth <= main.clientWidth + 1
  })

const profileId = async (email: string) =>
  (await serviceSelect<{ id: string }[]>(`profiles?select=id&email=eq.${encodeURIComponent(email)}`))[0].id

/** Today in Addis Ababa, like the app. */
const churchToday = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Addis_Ababa', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

type Beneficiary = { id: string; monthly_amount: number; status: string; notes: string | null }
const beneficiaryOf = async (memberId: string) =>
  serviceSelect<Beneficiary[]>(`workers_aid_beneficiaries?select=id,monthly_amount,status,notes&member_id=eq.${memberId}`)

/** One row per person: remove what an interrupted run left for this member. */
async function clearBeneficiary(request: APIRequestContext, memberId: string) {
  for (const b of await beneficiaryOf(memberId)) await request.delete(`/api/workers-aid-beneficiaries/${b.id}`)
}

test.describe('workers aid workspace (admin)', () => {
  test.use({ storageState: authFile('admin') })

  test('adds a beneficiary, records this month’s payments, edits and deletes a payment', async ({ page }) => {
    const who = TEST_USERS.finance
    const name = `${who.firstName} ${who.lastName}`
    const memberId = await profileId(who.email)
    const note = `E2E aid ${token()}`
    await clearBeneficiary(page.request, memberId)
    // "Record this month's payments" pays every unpaid active beneficiary; undo the ones that aren't ours.
    const allPayments = () => serviceSelect<{ id: string }[]>('workers_aid_disbursements?select=id')
    const before = new Set((await allPayments()).map((p) => p.id))

    try {
      // Beneficiaries tab: add, then change the amount.
      await page.goto('/dashboard/ministry/workers-aid#beneficiaries')
      await page.getByRole('button', { name: 'Add beneficiary' }).first().click()
      const dialog = page.getByRole('dialog', { name: 'Add beneficiary' })
      await dialog.getByLabel(/^Member/).fill(who.lastName)
      await dialog.getByRole('list', { name: 'Matching members' }).getByRole('button', { name: new RegExp(name) }).click()
      await dialog.getByLabel('Monthly amount (ETB)').fill('1200')
      await dialog.getByLabel('Notes').fill(note)
      await dialog.getByRole('button', { name: 'Add', exact: true }).click()
      await expect(dialog).toBeHidden()

      await page.getByRole('searchbox', { name: 'Search beneficiaries by name' }).fill(who.lastName)
      const row = page.getByRole('table', { name: 'Beneficiaries' }).getByRole('row').filter({ hasText: name })
      await expect(row).toContainText('1,200.00')
      await expect(row).toContainText('Active')
      await row.getByRole('button', { name: `Edit ${name}` }).click()
      const edit = page.getByRole('dialog', { name: 'Edit beneficiary' })
      await edit.getByLabel('Monthly amount (ETB)').fill('1234.5')
      await edit.getByRole('button', { name: 'Save changes' }).click()
      await expect(edit).toBeHidden()
      await expect(row).toContainText('1,234.50')
      const [beneficiary] = await beneficiaryOf(memberId)
      expect(beneficiary).toMatchObject({ monthly_amount: 1234.5, status: 'active', notes: note })
      const payments = () => serviceSelect<{ id: string; amount: number; disbursement_date: string; notes: string | null }[]>(
        `workers_aid_disbursements?select=id,amount,disbursement_date,notes&beneficiary_id=eq.${beneficiary.id}&order=created_at`,
      )

      // Disbursements tab: the new beneficiary is due this month; record everyone's payment at once.
      await page.getByRole('tab', { name: 'Disbursements' }).click()
      await expect(page.getByText('Monthly commitment')).toBeVisible()
      await page.getByRole('button', { name: 'Record this month’s payments' }).click()
      const confirm = page.getByRole('dialog', { name: 'Record this month’s payments?' })
      await confirm.getByRole('button', { name: 'Record payments' }).click()
      await expect(confirm).toBeHidden()
      await expect(page.getByText(/Every active beneficiary has been paid/)).toBeVisible()
      expect(await payments()).toEqual([expect.objectContaining({ amount: 1234.5, disbursement_date: churchToday() })])
      await expect(page.getByRole('table', { name: 'Disbursements' }).getByRole('row').filter({ hasText: name }).first()).toContainText('1,234.50')

      // A one-off extra payment through the form, corrected, then deleted.
      await page.getByRole('button', { name: 'Add payment' }).first().click()
      const add = page.getByRole('dialog', { name: 'Add payment' })
      await add.getByLabel('Beneficiary').selectOption(beneficiary.id)
      await add.getByLabel('Paid on').fill('2030-01-15')
      await add.getByLabel('Amount (ETB)').fill('300')
      await add.getByLabel('Notes').fill(note)
      await add.getByRole('button', { name: 'Add', exact: true }).click()
      await expect(add).toBeHidden()
      const extraRow = page.getByRole('table', { name: 'Disbursements' }).getByRole('row').filter({ hasText: '300.00' }).filter({ hasText: name })
      await extraRow.getByRole('button', { name: /^Edit / }).click()
      const editPayment = page.getByRole('dialog', { name: 'Edit payment' })
      await editPayment.getByLabel('Amount (ETB)').fill('350')
      await editPayment.getByRole('button', { name: 'Save changes' }).click()
      await expect(editPayment).toBeHidden()
      const extra = (await payments()).find((p) => p.notes === note)
      expect(extra).toMatchObject({ amount: 350, disbursement_date: '2030-01-15' })

      const extraEdited = page.getByRole('table', { name: 'Disbursements' }).getByRole('row').filter({ hasText: '350.00' }).filter({ hasText: name })
      await extraEdited.getByRole('button', { name: /^Delete / }).click()
      await page.getByRole('dialog', { name: 'Delete this payment?' }).getByRole('button', { name: 'Delete' }).click()
      await expect(page.getByText('Payment deleted')).toBeVisible()
      expect(await payments()).toHaveLength(1)

      // Deleting the beneficiary takes the payment history with it.
      await page.getByRole('tab', { name: 'Beneficiaries' }).click()
      await page.getByRole('searchbox', { name: 'Search beneficiaries by name' }).fill(who.lastName)
      await page.getByRole('table', { name: 'Beneficiaries' }).getByRole('button', { name: `Delete ${name}` }).click()
      const del = page.getByRole('dialog', { name: 'Delete this beneficiary?' })
      await expect(del).toContainText('payment history')
      await del.getByRole('button', { name: 'Delete' }).click()
      await expect(page.getByText('Beneficiary deleted')).toBeVisible()
      expect(await beneficiaryOf(memberId)).toHaveLength(0)
      expect(await payments()).toHaveLength(0)
    } finally {
      await clearBeneficiary(page.request, memberId)
      for (const p of await allPayments()) if (!before.has(p.id)) await page.request.delete(`/api/workers-aid-disbursements/${p.id}`)
    }
  })

  test('the monthly summary refuses a bad month', async ({ page }) => {
    expect((await page.request.get('/api/workers-aid-disbursements/months?month=2026-13')).status()).toBe(400)
    const res = await page.request.get('/api/workers-aid-disbursements/months?month=2026-10')
    expect(res.status()).toBe(200)
    const summary = (await res.json()) as { month: string; months: { month: string }[] }
    expect(summary.months.map((m) => m.month)).toEqual(['2026-10', '2026-09', '2026-08'])
  })
})

test.describe('workers aid workspace on a phone (admin)', () => {
  test.use({ storageState: authFile('admin'), viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('fits the screen, with cards instead of a table', async ({ page }) => {
    const memberId = await profileId(TEST_USERS.member.email)
    await clearBeneficiary(page.request, memberId)
    // Inactive, so it is never paid by another test's "record this month's payments".
    const created = await page.request.post('/api/workers-aid-beneficiaries', { data: { member_id: memberId, monthly_amount: 777, status: 'inactive' } })
    expect(created.status()).toBe(201)
    try {
      await page.goto('/dashboard/ministry/workers-aid#beneficiaries')
      await page.getByRole('searchbox', { name: 'Search beneficiaries by name' }).fill(TEST_USERS.member.lastName)
      const cards = page.getByRole('list', { name: 'Beneficiaries' })
      await expect(cards.getByRole('listitem').filter({ hasText: TEST_USERS.member.lastName })).toContainText('777.00')
      await expect(page.getByRole('table', { name: 'Beneficiaries' })).toBeHidden()
      expect(await fitsWidth(page)).toBe(true)

      await page.getByRole('tab', { name: 'Disbursements' }).click()
      await expect(page.getByText('Monthly commitment')).toBeVisible()
      expect(await fitsWidth(page)).toBe(true)
    } finally {
      await clearBeneficiary(page.request, memberId)
    }
  })
})

for (const role of ['member', 'ministry_leader'] as const) {
  test.describe(`workers aid workspace (${role})`, () => {
    test.use({ storageState: authFile(role) })

    test('is refused by the workers aid APIs', async ({ page }) => {
      const memberId = await profileId(TEST_USERS.member.email)
      const calls = [
        page.request.get('/api/workers-aid-beneficiaries'),
        page.request.get('/api/workers-aid-disbursements'),
        page.request.get('/api/workers-aid-disbursements/months'),
        page.request.post('/api/workers-aid-beneficiaries', { data: { member_id: memberId, monthly_amount: 10 } }),
        page.request.post('/api/workers-aid-disbursements', { data: { beneficiary_id: ZERO, disbursement_date: '2030-01-01', amount: 10 } }),
        page.request.post('/api/workers-aid-disbursements/months', { data: { disbursement_date: '2030-01-01' } }),
        page.request.patch(`/api/workers-aid-beneficiaries/${ZERO}`, { data: { monthly_amount: 5 } }),
        page.request.delete(`/api/workers-aid-beneficiaries/${ZERO}`),
        page.request.patch(`/api/workers-aid-disbursements/${ZERO}`, { data: { amount: 5 } }),
        page.request.delete(`/api/workers-aid-disbursements/${ZERO}`),
      ]
      for (const res of await Promise.all(calls)) expect(res.status(), res.url()).toBe(403)

      await page.goto('/dashboard/ministry/workers-aid#disbursements')
      if (role === 'member') {
        await expect(page).toHaveURL(/\/dashboard(#.*)?$/)
      } else {
        await expect(page.getByText('Disbursements are confidential.')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Record this month’s payments' })).toHaveCount(0)
      }
    })
  })
}
