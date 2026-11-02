import { expect, test } from '@playwright/test'
import { authFile, serviceSelect } from '../helpers'
import { TEST_USERS } from '../users'
import { addRow, deleteRow, editRow, findRow, fitsWidth, pickMember, profileId, unique, ZERO } from '../workspace'

// Marriage & Family workspace: seminars only. Counseling is confidential pastoral care and is not part
// of this workspace (no tab, no route).

const URL = '/dashboard/ministry/marriage-family'
const elder = TEST_USERS.elder

test.describe('marriage & family workspace (admin)', () => {
  test.use({ storageState: authFile('admin') })

  test('plans a seminar, changes it and deletes it; no counseling in sight', async ({ page }) => {
    const title = unique('E2E Seminar')
    const elderId = await profileId(elder.email)
    const saved = () => serviceSelect<{ id: string; seminar_date: string | null; location: string | null; facilitator_id: string | null }[]>(
      `marriage_seminars?select=id,seminar_date,location,facilitator_id&title=eq.${encodeURIComponent(title)}`,
    )

    await page.goto(URL)
    await expect(page.getByRole('heading', { name: 'Marriage & Family' })).toBeVisible()
    await expect(page.getByRole('tab', { name: /counsel/i })).toHaveCount(0)
    await page.getByRole('tab', { name: 'Seminars', exact: true }).click()

    await addRow(page, 'seminar', async (d) => {
      await d.getByLabel('Title').fill(title)
      await d.getByLabel('Date').fill('2030-09-12')
      await d.getByLabel('Place').fill('Fellowship hall')
      await pickMember(d, 'Facilitator', elder)
    })
    const row = await findRow(page, 'Seminars', 'Search by title or place', title)
    await expect(row).toContainText('12 Sept 2030')
    await expect(row).toContainText(`${elder.firstName} ${elder.lastName}`)
    expect(await saved()).toMatchObject([{ seminar_date: '2030-09-12', location: 'Fellowship hall', facilitator_id: elderId }])

    // Clearing the date leaves the seminar "to be set".
    await editRow(page, row, 'seminar', (d) => d.getByLabel('Date').fill(''))
    await expect(row).toContainText('To be set')
    expect(await saved()).toMatchObject([{ seminar_date: null }])

    await deleteRow(page, row, 'seminar')
    expect(await saved()).toEqual([])
    expect((await page.request.get('/api/counseling-services')).status()).toBe(404)
  })
})

test.describe('marriage & family workspace on a phone (admin)', () => {
  test.use({ storageState: authFile('admin'), viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('fits the screen, with cards instead of a table', async ({ page }) => {
    const title = unique('E2E Phone seminar')
    const created = await page.request.post('/api/marriage-seminars', { data: { title, location: 'Phone hall' } })
    expect(created.status()).toBe(201)
    const { id } = (await created.json()) as { id: string }
    try {
      await page.goto(`${URL}#seminars`)
      await page.getByRole('searchbox', { name: 'Search by title or place' }).fill(title)
      const cards = page.getByRole('list', { name: 'Seminars' })
      await expect(cards.getByRole('listitem').filter({ hasText: title })).toContainText('Phone hall')
      await expect(page.getByRole('table', { name: 'Seminars' })).toBeHidden()
      expect(await fitsWidth(page)).toBe(true)
    } finally {
      await page.request.delete(`/api/marriage-seminars/${id}`)
    }
  })
})

test.describe('marriage & family workspace (member)', () => {
  test.use({ storageState: authFile('member') })

  test('reads seminars but is refused by the write APIs and the page', async ({ page }) => {
    const writes = [
      page.request.post('/api/marriage-seminars', { data: { title: unique('E2E Member seminar') } }),
      page.request.patch(`/api/marriage-seminars/${ZERO}`, { data: { title: 'x' } }),
      page.request.delete(`/api/marriage-seminars/${ZERO}`),
    ]
    for (const res of await Promise.all(writes)) expect(res.status(), res.url()).toBe(403)
    expect((await page.request.get('/api/marriage-seminars')).status()).toBe(200)

    await page.goto(URL)
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
