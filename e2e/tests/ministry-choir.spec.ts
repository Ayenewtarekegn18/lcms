import { expect, test, type Page } from '@playwright/test'
import { authFile, serviceSelect } from '../helpers'
import { TEST_USERS } from '../users'

// Ministry workspaces (docs/MINISTRY_WORKSPACES.md): the hub shows the ministries from the database, and
// the Neftalem Choir workspace (the reference conversion) reads and writes only through its API routes,
// which only staff may write to.

/** A name no other run or test uses. */
const unique = (label: string) =>
  `${label} ${test.info().testId.slice(0, 6)}${test.info().retry}-${Math.random().toString(36).slice(2, 8)}`

const ZERO = '00000000-0000-0000-0000-000000000000'

// <main> is the scroll container, so overflow can hide inside it without widening the document.
const fitsWidth = (page: Page) =>
  page.evaluate(() => {
    const main = document.getElementById('main-content')
    return document.documentElement.scrollWidth <= window.innerWidth + 1 && !!main && main.scrollWidth <= main.clientWidth + 1
  })

type Ministry = { id: string; slug: string; name: string }
const choir = async () => (await serviceSelect<Ministry[]>('ministries?select=id,slug,name&slug=eq.choir'))[0]
const profileId = async (email: string) =>
  (await serviceSelect<{ id: string }[]>(`profiles?select=id&email=eq.${encodeURIComponent(email)}`))[0].id

test.describe('ministry workspaces (admin)', () => {
  test.use({ storageState: authFile('admin') })

  test('the hub shows the ministries from the database with their member counts', async ({ page }) => {
    const ministries = await serviceSelect<Ministry[]>('ministries?select=id,slug,name&slug=not.is.null&is_active=not.is.false')
    expect(ministries.length).toBeGreaterThanOrEqual(14)
    const { id } = await choir()
    const members = await serviceSelect<unknown[]>(`ministry_members?select=id&ministry_id=eq.${id}&is_active=eq.true`)

    await page.goto('/dashboard/ministry')
    await expect(page.getByRole('heading', { name: 'Ministries', exact: true })).toBeVisible()
    const cards = page.getByRole('list', { name: 'Ministries' }).getByRole('listitem')
    await expect(cards).toHaveCount(ministries.length)

    const card = cards.filter({ hasText: 'Neftalem Choir' })
    await expect(card).toContainText('ንፍታሌም መዘምራን')
    await expect(card).toContainText(`${members.length} ${members.length === 1 ? 'member' : 'members'}`)
    await card.getByRole('link').click()
    await expect(page).toHaveURL(/\/dashboard\/ministry\/choir$/)
    await expect(page.getByRole('heading', { name: 'Neftalem Choir' })).toBeVisible()
  })

  test('adds a member with a role, changes it and removes them', async ({ page }) => {
    const { id: ministryId } = await choir()
    const elder = TEST_USERS.elder
    const elderId = await profileId(elder.email)
    const name = `${elder.firstName} ${elder.lastName}`
    const saved = () => serviceSelect<{ role: string; is_active: boolean }[]>(
      `ministry_members?select=role,is_active&ministry_id=eq.${ministryId}&member_id=eq.${elderId}`,
    )

    // Start from "not a member" whatever earlier runs left behind.
    for (const row of await serviceSelect<{ id: string }[]>(`ministry_members?select=id&ministry_id=eq.${ministryId}&member_id=eq.${elderId}&is_active=eq.true`)) {
      await page.request.delete(`/api/ministry-members/${row.id}`)
    }

    await page.goto('/dashboard/ministry/choir')
    await page.getByRole('tab', { name: 'Members' }).click()
    await page.getByRole('button', { name: 'Add member' }).first().click()

    const dialog = page.getByRole('dialog', { name: 'Add member' })
    await dialog.getByLabel(/^Member/).fill(elder.lastName)
    await dialog.getByRole('list', { name: 'Matching members' }).getByRole('button', { name: new RegExp(name) }).click()
    await dialog.getByLabel('Role').selectOption('co_leader')
    await dialog.getByRole('button', { name: 'Add', exact: true }).click()
    await expect(page.getByText('Member added')).toBeVisible({ timeout: 20_000 })
    await expect(dialog).toBeHidden()

    const row = page.getByRole('table', { name: 'Members' }).getByRole('row').filter({ hasText: name })
    await expect(row).toContainText('Co-leader')
    expect(await saved()).toEqual([{ role: 'co_leader', is_active: true }])

    // Change the role: the header's leader count follows.
    await row.getByRole('button', { name: `Edit ${name}` }).click()
    const edit = page.getByRole('dialog', { name: 'Edit member' })
    await edit.getByLabel('Role').selectOption('leader')
    await edit.getByRole('button', { name: 'Save changes' }).click()
    await expect(edit).toBeHidden()
    await expect(row).toContainText('Leader')
    expect(await saved()).toEqual([{ role: 'leader', is_active: true }])

    // Remove, after confirming.
    await row.getByRole('button', { name: `Remove ${name}` }).click()
    const confirm = page.getByRole('dialog', { name: 'Remove this member?' })
    await confirm.getByRole('button', { name: 'Remove' }).click()
    await expect(confirm).toBeHidden()
    await expect(page.getByRole('table', { name: 'Members' }).getByRole('row').filter({ hasText: name })).toHaveCount(0)
    expect(await saved()).toEqual([{ role: 'leader', is_active: false }])
  })

  test('adds a song and a schedule entry, deletes the song after confirming', async ({ page }) => {
    const title = unique('E2E Song')
    const place = unique('E2E Hall')

    await page.goto('/dashboard/ministry/choir#songs')
    await expect(page.getByRole('tab', { name: 'Songs' })).toHaveAttribute('aria-selected', 'true')
    await page.getByRole('button', { name: 'Add song' }).first().click()
    const songDialog = page.getByRole('dialog', { name: 'Add song' })
    await songDialog.getByLabel('Title').fill(title)
    await songDialog.getByLabel('Composer').fill('Traditional')
    await songDialog.getByLabel('Lyrics link').fill('not a link')
    await songDialog.getByRole('button', { name: 'Add', exact: true }).click()
    await expect(songDialog.getByText('Enter a full web address')).toBeVisible() // checked before sending
    await songDialog.getByLabel('Lyrics link').fill('https://example.org/lyrics')
    await songDialog.getByRole('button', { name: 'Add', exact: true }).click()
    await expect(songDialog).toBeHidden()

    await page.getByRole('searchbox', { name: 'Search by title or composer' }).fill(title)
    const songRow = page.getByRole('table', { name: 'Songs' }).getByRole('row').filter({ hasText: title })
    await expect(songRow).toContainText('Traditional')
    const [song] = await serviceSelect<{ id: string; composer: string; lyrics_url: string }[]>(
      `choir_songs?select=id,composer,lyrics_url&title=eq.${encodeURIComponent(title)}`,
    )
    expect(song).toMatchObject({ composer: 'Traditional', lyrics_url: 'https://example.org/lyrics' })

    // Schedule: a performance on a fixed day.
    await page.getByRole('tab', { name: 'Schedule' }).click()
    await page.getByRole('button', { name: 'Add schedule entry' }).first().click()
    const entry = page.getByRole('dialog', { name: 'Add schedule entry' })
    await entry.getByLabel('Date').fill('2030-05-04')
    await entry.getByLabel('Type').selectOption('performance')
    await entry.getByLabel('Location').fill(place)
    await entry.getByRole('button', { name: 'Add', exact: true }).click()
    await expect(entry).toBeHidden()
    await expect(page.getByRole('table', { name: 'Schedule' }).getByRole('row').filter({ hasText: place })).toContainText('performance')
    const [planned] = await serviceSelect<{ id: string; event_date: string; event_type: string }[]>(
      `choir_schedule?select=id,event_date,event_type&location=eq.${encodeURIComponent(place)}`,
    )
    expect(planned).toMatchObject({ event_date: '2030-05-04', event_type: 'performance' })
    expect((await page.request.delete(`/api/choir-schedule/${planned.id}`)).status()).toBe(200)

    // Delete the song: nothing happens until it is confirmed.
    await page.getByRole('tab', { name: 'Songs' }).click()
    await page.getByRole('searchbox', { name: 'Search by title or composer' }).fill(title)
    await page.getByRole('table', { name: 'Songs' }).getByRole('button', { name: `Delete ${title}` }).click()
    const confirm = page.getByRole('dialog', { name: 'Delete this song?' })
    await expect(confirm).toContainText(title)
    await confirm.getByRole('button', { name: 'Cancel' }).click()
    expect(await serviceSelect<unknown[]>(`choir_songs?select=id&id=eq.${song.id}`)).toHaveLength(1)

    await page.getByRole('table', { name: 'Songs' }).getByRole('button', { name: `Delete ${title}` }).click()
    await page.getByRole('dialog', { name: 'Delete this song?' }).getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Song deleted')).toBeVisible()
    await expect(page.getByRole('table', { name: 'Songs' }).getByRole('row').filter({ hasText: title })).toHaveCount(0)
    expect(await serviceSelect<unknown[]>(`choir_songs?select=id&id=eq.${song.id}`)).toHaveLength(0)
  })
})

test.describe('ministry workspaces on a phone (admin)', () => {
  test.use({ storageState: authFile('admin'), viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('the hub and the choir fit the screen, with cards instead of a table', async ({ page }) => {
    const title = unique('E2E Phone song')
    const created = await page.request.post('/api/choir-songs', { data: { title, composer: 'Phone test' } })
    expect(created.status()).toBe(201)
    const { id } = (await created.json()) as { id: string }

    try {
      await page.goto('/dashboard/ministry')
      await expect(page.getByRole('list', { name: 'Ministries' }).getByRole('listitem').first()).toBeVisible()
      expect(await fitsWidth(page)).toBe(true)

      await page.goto('/dashboard/ministry/choir#songs')
      await page.getByRole('searchbox', { name: 'Search by title or composer' }).fill(title)
      const cards = page.getByRole('list', { name: 'Songs' })
      await expect(cards.getByRole('listitem').filter({ hasText: title })).toContainText('Phone test')
      await expect(page.getByRole('table', { name: 'Songs' })).toBeHidden()
      await expect(cards.getByRole('button', { name: `Delete ${title}` })).toBeVisible()
      expect(await fitsWidth(page)).toBe(true)
    } finally {
      await page.request.delete(`/api/choir-songs/${id}`)
    }
  })
})

test.describe('ministry workspaces (member)', () => {
  test.use({ storageState: authFile('member') })

  test('is refused by the choir and ministry write APIs and the workspace page', async ({ page }) => {
    const { id: ministryId } = await choir()
    const memberId = await profileId(TEST_USERS.member.email)
    const writes = [
      page.request.post('/api/choir-songs', { data: { title: unique('E2E Member song') } }),
      page.request.post('/api/choir-schedule', { data: { event_date: '2030-05-04' } }),
      page.request.post('/api/choir-members', { data: { member_id: memberId } }),
      page.request.post('/api/ministry-members', { data: { ministry_id: ministryId, member_id: memberId, role: 'leader' } }),
      page.request.patch(`/api/choir-songs/${ZERO}`, { data: { title: 'x' } }),
      page.request.delete(`/api/choir-schedule/${ZERO}`),
      page.request.patch(`/api/ministry-members/${ZERO}`, { data: { role: 'leader' } }),
    ]
    for (const res of await Promise.all(writes)) expect(res.status(), res.url()).toBe(403)
    // Staff-only reads: who serves where.
    expect((await page.request.get('/api/choir-members')).status()).toBe(403)
    expect((await page.request.get('/api/ministries/by-slug/choir')).status()).toBe(403)
    // The song library itself is open to every member (RLS: member-readable).
    expect((await page.request.get('/api/choir-songs')).status()).toBe(200)

    await page.goto('/dashboard/ministry/choir')
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
