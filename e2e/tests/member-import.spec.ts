import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { authFile, serviceSelect } from '../helpers'

// Members → Import: lebu-form JSON (and photos named by member number) into the register, keeping
// the numbers. Each run uses its own prefix, so earlier runs never collide; the "new registrations"
// prefix is left unchanged so other tests keep their numbering.

// A 1×1 PNG, as a member photo.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')

const prefix = () => `E2E${randomUUID().replace(/[^0-9a-f]/g, '').slice(0, 5).toUpperCase()}`
const member = (number: string, first: string) => ({
  memberId: number, firstNameAm: first, fatherNameAm: 'ፈተና', sex: 'female', phone: '0911555000',
  subcity: 'nifas-silk', depts: 'choir;worship', status: 'active', photoDrive: 'ignored',
})
const backup = (members: object[]) => ({ name: 'lebu-kale-hiwot-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ church: {}, count: members.length, members })) })

type Details = { member_id: string; member_number: string; photo_path: string | null; departments: string[] }
const details = (numbers: string[]) =>
  serviceSelect<Details[]>(`member_details?select=member_id,member_number,photo_path,departments&member_number=in.(${numbers.join(',')})&order=member_number`)

test.describe('member import (admin)', () => {
  test.use({ storageState: authFile('admin') })

  test('imports lebu-form records with their numbers and photos, and a second import changes nothing', async ({ page }) => {
    const p = prefix()
    const numbers = [`${p}-0001`, `${p}-0002`]
    const file = backup([member(numbers[0], 'ሩት'), member(numbers[1], 'ማርታ'), { memberId: `${p}-0003`, fatherNameAm: 'no first name', sex: 'male', phone: '0911555003' }])

    await page.goto('/dashboard/members')
    await page.getByRole('link', { name: 'Import' }).click()
    await expect(page.getByRole('heading', { name: 'Import members' })).toBeVisible()

    const [jsonInput, photoInput] = [page.locator('input[type=file]').nth(0), page.locator('input[type=file]').nth(1)]
    await jsonInput.setInputFiles(file)
    await photoInput.setInputFiles({ name: `${numbers[0]}.png`, mimeType: 'image/png', buffer: PNG })
    const check = page.getByRole('region', { name: 'Check' })
    await expect(check).toContainText('Ready to import2')
    await expect(check).toContainText('With problems1')
    await expect(check).toContainText('With a photo1')
    await expect(page.getByText(`${p}-0003`)).toContainText('First name')

    // The test prefix must not become the numbering for everyone else's registrations.
    await page.getByRole('checkbox', { name: new RegExp(`Number new registrations ${p}`) }).uncheck()
    await page.getByRole('button', { name: 'Import 2 members' }).click()
    const results = page.getByRole('region', { name: 'Import results' })
    await expect(page.getByRole('link', { name: 'Open the member list' })).toBeVisible({ timeout: 30_000 })
    await expect(results).toContainText('Imported2')
    await expect(page.getByText('Photos uploaded: 1.')).toBeVisible()

    const saved = await details(numbers)
    expect(saved.map((d) => d.member_number)).toEqual(numbers)
    expect(saved[0].photo_path).toBe(`${saved[0].member_id}.jpg`)
    expect(saved[1].photo_path).toBeNull()
    expect(saved[0].departments).toEqual(['choir', 'worship'])

    // Again: everything is already there.
    await page.getByRole('button', { name: 'Import more' }).click()
    await jsonInput.setInputFiles(file)
    await page.getByRole('button', { name: 'Import 2 members' }).click()
    await expect(page.getByRole('link', { name: 'Open the member list' })).toBeVisible({ timeout: 30_000 })
    await expect(results).toContainText('Imported0')
    await expect(results).toContainText('Already in the register2')
    expect(await details(numbers)).toHaveLength(2)

    // New registrations still use the church's own prefix.
    const next = await (await page.request.get('/api/members/import')).json()
    expect(next.prefix).not.toBe(p)
  })

  test('the registration form cannot choose its own member number', async ({ page }) => {
    const res = await page.request.post('/api/members/register', {
      data: { firstNameAm: 'ሀ', fatherNameAm: 'ለ', sex: 'male', phone: '0911555111', memberNumber: 'LKH-0001' },
    })
    expect(res.status()).toBe(400)
  })
})

for (const role of ['elder', 'member'] as const) {
  test.describe(`member import (${role})`, () => {
    test.use({ storageState: authFile(role) })

    test('is refused', async ({ page }) => {
      const res = await page.request.post('/api/members/import', { data: { members: [member(`${prefix()}-0001`, 'ሀ')] } })
      expect(res.status()).toBe(403)
      await page.goto('/dashboard/members/import')
      await expect(page).not.toHaveURL(/\/members\/import/)
    })
  })
}
