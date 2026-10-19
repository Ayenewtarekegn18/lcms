import { expect, test, type Page } from '@playwright/test'
import { MSG } from '../../lib/members/registration'
import { authFile, serviceSelect } from '../helpers'

const field = (page: Page, key: string) => page.locator(`#field-${key}`)
const chip = (page: Page, key: string, label: string) => field(page, key).locator('label', { hasText: label })

test.describe('registration (admin)', () => {
  test.use({ storageState: authFile('admin') })

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/members/register')
    await expect(page.getByRole('heading', { name: 'አዲስ አባል ይመዝገቡ' })).toBeVisible()
  })

  test('shows the next member number', async ({ page }) => {
    await expect(page.getByTestId('next-member-number')).toHaveText(/^LKH-\d{4}$/)
  })

  test('reports missing and invalid fields with the lebu-form messages', async ({ page }) => {
    await page.getByRole('button', { name: /Save member/ }).click()
    for (const k of ['firstNameAm', 'fatherNameAm', 'sex', 'phone']) {
      await expect(field(page, k).getByRole('alert')).toHaveText(MSG.required)
    }
    await page.locator('#phone').fill('12 34')
    await page.locator('#email').fill('nope')
    await page.getByRole('button', { name: /Save member/ }).click()
    await expect(field(page, 'phone').getByRole('alert')).toHaveText(MSG.phone)
    await expect(field(page, 'email').getByRole('alert')).toHaveText(MSG.email)
  })

  test('shows conditional fields only when they apply', async ({ page }) => {
    await expect(field(page, 'spouse')).toHaveCount(0)
    await page.locator('#marital').selectOption('married')
    await expect(field(page, 'spouse')).toBeVisible()
    await page.locator('#marital').selectOption('single')
    await expect(field(page, 'spouse')).toHaveCount(0)

    await expect(field(page, 'baptismDate')).toHaveCount(0)
    await chip(page, 'baptized', 'Yes').click()
    await expect(field(page, 'baptismDate')).toBeVisible()

    await chip(page, 'depts', 'Choir').click()
    await chip(page, 'depts', 'Not currently serving').click()
    await expect(field(page, 'depts').locator('input:checked')).toHaveCount(1)
    await expect(field(page, 'wantsDept')).toBeVisible()
  })

  test('one row per child, following the number of children', async ({ page }) => {
    await page.locator('#children').fill('3')
    await expect(page.getByLabel(/^Child \d full name$/)).toHaveCount(3)
    await page.locator('#children').fill('1')
    await expect(page.getByLabel(/^Child \d full name$/)).toHaveCount(1)
  })

  test('saves a member and gives them the next number', async ({ page }) => {
    const next = page.getByTestId('next-member-number')
    await expect(next).toHaveText(/^LKH-\d{4}$/) // loaded, not the "—" placeholder
    const expected = await next.textContent()
    const phone = `09${Date.now().toString().slice(-8)}`
    await page.locator('#firstNameAm').fill('ሙከራ')
    await page.locator('#fatherNameAm').fill('ኢትዮጵያ')
    await chip(page, 'sex', 'Female').click()
    await page.locator('#phone').fill(phone)
    await page.locator('#marital').selectOption('married')
    await page.locator('#spouse').fill('ተስፋዬ')
    await page.locator('#children').fill('2')
    await page.getByLabel('Child 1 full name').fill('ሔዋን')
    await page.getByLabel('Child 1 age').fill('9')
    await page.getByLabel('Child 2 full name').fill('ዳዊት')
    await page.getByLabel('Child 2 age').fill('19')
    await expect(page.getByText('1 under 18 · 1 18 and over')).toBeVisible()
    await chip(page, 'depts', 'Choir').click()
    await chip(page, 'depts', 'Prayer').click()
    await page.getByRole('button', { name: /Save member/ }).click()

    const number = page.getByTestId('member-number')
    await expect(number).toHaveText(/^LKH-\d{4}$/)
    expect(await number.textContent()).toBe(expected)

    const [row] = await serviceSelect<{ member_number: string; children: unknown[] }[]>(
      `member_details?select=*&member_number=eq.${expected}`,
    )
    expect(row).toMatchObject({
      member_number: expected, marital_status: 'married', spouse_name: 'ተስፋዬ', children_count: 2,
      departments: ['choir', 'prayer'], membership_status: 'active',
    })
    expect(row.children).toHaveLength(2)
  })
})

test.describe('registration (ministry leader)', () => {
  test.use({ storageState: authFile('ministry_leader') })

  test('can see the members list but not register', async ({ page }) => {
    await page.goto('/dashboard/members/register')
    await expect(page).toHaveURL(/\/dashboard$/)
    expect((await page.request.post('/api/members/register', { data: {} })).status()).toBe(403)
  })
})
