import { expect, test, type Page } from '@playwright/test'
import { formatBirr, toCents, type LedgerPage } from '../../lib/financial/summary'
import { authFile } from '../helpers'

// A label unique to this run, so the specs don't depend on each other or on existing ledger rows.
const unique = (what: string) => `e2e ${what} ${test.info().testId}-${Math.random().toString(36).slice(2, 8)}`

const ledger = async (page: Page) => {
  const res = await page.request.get('/api/financial')
  expect(res.status()).toBe(200)
  return (await res.json()) as LedgerPage
}

/** a + b in Birr without floating-point drift. */
const plus = (a: number, b: number) => (toCents(a) + toCents(b)) / 100

async function record(page: Page, kind: 'income' | 'expense', category: string, amount: string, description: string) {
  await page.getByRole('button', { name: 'Add Transaction' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('#transaction_type').selectOption(kind)
  await dialog.locator('#category').selectOption(category)
  await dialog.locator('#amount').fill(amount)
  await dialog.locator('#description').fill(description)
  await dialog.getByRole('button', { name: 'Save transaction' }).click()
  await expect(page.getByText(kind === 'income' ? 'Income recorded' : 'Expense recorded')).toBeVisible()
  await expect(dialog).toHaveCount(0)
}

test.describe('financial ledger (finance)', () => {
  test.use({ storageState: authFile('finance') })

  test('records an income and an expense and sees them with Birr amounts and new totals', async ({ page }) => {
    const before = (await ledger(page)).totals.allTime
    const income = unique('income')
    const expense = unique('expense')

    await page.goto('/dashboard/financial')
    await expect(page.getByRole('heading', { name: 'Financial Management' })).toBeVisible()
    await expect(page.getByTestId('income-all')).toHaveText(formatBirr(before.income))

    await record(page, 'income', 'Tithes', '123.45', income)
    await record(page, 'expense', 'Utilities', '67.80', expense)

    const incomeRow = page.getByTestId('ledger-row').filter({ hasText: income })
    await expect(incomeRow).toContainText('Income')
    await expect(incomeRow).toContainText('Tithes')
    await expect(incomeRow).toContainText(formatBirr(123.45))
    const expenseRow = page.getByTestId('ledger-row').filter({ hasText: expense })
    await expect(expenseRow).toContainText('Expense')
    await expect(expenseRow).toContainText(formatBirr(67.8))

    await expect(page.getByTestId('income-all')).toHaveText(formatBirr(plus(before.income, 123.45)))
    await expect(page.getByTestId('expense-all')).toHaveText(formatBirr(plus(before.expense, 67.8)))

    // The API agrees, and the new rows count toward this month (they default to today).
    const after = await ledger(page)
    expect(after.totals.allTime.count).toBeGreaterThanOrEqual(before.count + 2)
    expect(after.transactions.some((t) => t.description === income && t.transaction_type === 'income')).toBe(true)
  })

  test('rejects a bad amount and fields the server owns', async ({ page }) => {
    const base = { transaction_type: 'income', category: 'Tithes', description: unique('invalid') }
    expect((await page.request.post('/api/financial', { data: { ...base, amount: 0 } })).status()).toBe(400)
    expect((await page.request.post('/api/financial', { data: { ...base, amount: 1.234 } })).status()).toBe(400)
    expect((await page.request.post('/api/financial', { data: { ...base, amount: 5, type: 'income' } })).status()).toBe(400)
    expect((await page.request.post('/api/financial', { data: { ...base, amount: 5, recorded_by_id: crypto.randomUUID() } })).status()).toBe(400)
  })

  test('may not delete ledger rows (admins only)', async ({ page }) => {
    const res = await page.request.post('/api/financial', {
      data: { transaction_type: 'expense', category: 'Supplies', amount: 1, description: unique('keep') },
    })
    expect(res.status()).toBe(201)
    const { id } = await res.json()
    expect((await page.request.delete(`/api/financial/${id}`)).status()).toBe(403)
  })
})

test.describe('financial ledger (admin)', () => {
  test.use({ storageState: authFile('admin') })

  test('deletes a transaction after confirming in a dialog', async ({ page }) => {
    const description = unique('delete')
    const res = await page.request.post('/api/financial', {
      data: { transaction_type: 'expense', category: 'Supplies', amount: 2.5, description },
    })
    expect(res.status()).toBe(201)

    await page.goto('/dashboard/financial')
    const row = page.getByTestId('ledger-row').filter({ hasText: description })
    await row.getByRole('button', { name: /^Delete/ }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText(description)
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()
    await expect(page.getByText('Transaction deleted')).toBeVisible()
    await expect(row).toHaveCount(0)
  })
})

test.describe('as a plain member', () => {
  test.use({ storageState: authFile('member') })

  test('is refused by the financial and reports APIs', async ({ page }) => {
    expect((await page.request.get('/api/financial')).status()).toBe(403)
    const post = await page.request.post('/api/financial', {
      data: { transaction_type: 'income', category: 'Tithes', amount: 10 },
    })
    expect(post.status()).toBe(403)
    expect((await page.request.delete(`/api/financial/${crypto.randomUUID()}`)).status()).toBe(403)
    expect((await page.request.get('/api/reports')).status()).toBe(403)
  })
})

test.describe('reports', () => {
  test.describe('finance', () => {
    test.use({ storageState: authFile('finance') })

    test('shows real figures and none of the invented ones', async ({ page }) => {
      await page.goto('/dashboard/reports')
      await expect(page.getByRole('heading', { name: 'Reports & Analytics' })).toBeVisible()
      for (const key of ['members-active', 'ministries', 'events-upcoming', 'attendance']) {
        await expect(page.getByTestId(`report-${key}`)).toHaveText(/^\d[\d,]*$/)
      }
      const { totals } = await ledger(page)
      await expect(page.getByTestId('report-all-income')).toHaveText(formatBirr(totals.allTime.income))
      await expect(page.getByTestId('report-all-expense')).toHaveText(formatBirr(totals.allTime.expense))
      await expect(page.getByTestId('report-month-net')).toHaveText(formatBirr(totals.thisMonth.net))

      for (const invented of ['Growth Trends', 'System Status', 'Avg Attendance', 'Age Distribution']) {
        await expect(page.getByText(invented)).toHaveCount(0)
      }
    })
  })

  test.describe('ministry leader', () => {
    test.use({ storageState: authFile('ministry_leader') })

    test('sees the counts but no money figures', async ({ page }) => {
      await page.goto('/dashboard/reports')
      await expect(page.getByTestId('report-members-active')).toHaveText(/^\d[\d,]*$/)
      await expect(page.getByTestId('report-all-income')).toHaveCount(0)
      await expect(page.getByText('Financial figures are shown to admins, elders and the finance team.')).toBeVisible()
    })
  })
})
