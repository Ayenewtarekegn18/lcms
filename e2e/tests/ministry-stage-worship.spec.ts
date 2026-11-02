import { expect, test } from '@playwright/test'
import { authFile, serviceSelect } from '../helpers'
import { TEST_USERS } from '../users'
import { addRow, deleteRow, editRow, findRow, fitsWidth, openTab, pickMember, profileId, unique, ZERO } from '../workspace'

// Stage & Worship workspace: services, teams and their members, rehearsals, equipment. Everything goes
// through the API routes; staff write, a member only reads the services and teams.

const URL = '/dashboard/ministry/stage-worship'
const elder = TEST_USERS.elder
const elderName = `${elder.firstName} ${elder.lastName}`

test.describe('stage & worship workspace (admin)', () => {
  test.use({ storageState: authFile('admin') })

  test('plans a service, a rehearsal for it, changes both and deletes them', async ({ page }) => {
    const title = unique('E2E Service')
    const notes = unique('E2E Rehearsal')
    const elderId = await profileId(elder.email)
    type Service = { id: string; event_date: string; worship_type: string; worship_leader_id: string; location: string }
    const service = async () => (await serviceSelect<Service[]>(
      `worship_events?select=id,event_date,worship_type,worship_leader_id,location&title=eq.${encodeURIComponent(title)}`,
    ))[0]

    await page.goto(URL)
    await expect(page.getByRole('heading', { name: 'Stage & Worship' })).toBeVisible()
    await openTab(page, 'Services')
    await addRow(page, 'service', async (d) => {
      await d.getByLabel('Title').fill(title)
      await d.getByLabel('Date').fill('2030-05-04')
      await d.getByLabel('Type').selectOption('midweek')
      await pickMember(d, 'Worship leader', elder)
      await d.getByLabel('Place').fill('Main sanctuary')
      await d.getByLabel('Songs').fill('Song one\nSong two')
    })
    const row = await findRow(page, 'Services', 'Search by title or place', title)
    await expect(row).toContainText('4 May 2030')
    await expect(row).toContainText('Midweek service')
    await expect(row).toContainText(elderName)
    const saved = await service()
    expect(saved).toMatchObject({ worship_type: 'midweek', worship_leader_id: elderId, location: 'Main sanctuary' })
    expect(saved.event_date.slice(0, 10)).toBe('2030-05-04')

    // The edit form starts with the saved day (a timestamptz column) and keeps it.
    await editRow(page, row, 'service', async (d) => {
      await expect(d.getByLabel('Date')).toHaveValue('2030-05-04')
      await d.getByLabel('Type').selectOption('special')
      await d.getByLabel('Place').fill('Fellowship hall')
    })
    await expect(row).toContainText('Special service')
    expect(await service()).toMatchObject({ worship_type: 'special', location: 'Fellowship hall' })
    expect((await service()).event_date.slice(0, 10)).toBe('2030-05-04')

    // A rehearsal for that service.
    await openTab(page, 'Rehearsals')
    await addRow(page, 'rehearsal', async (d) => {
      await d.getByLabel('Date').fill('2030-05-02')
      await d.getByLabel('For service').selectOption({ label: `${title} · 4 May 2030` })
      await d.getByLabel('Notes').fill(notes)
    })
    const rehearsal = await findRow(page, 'Rehearsals', 'Search notes', notes)
    await expect(rehearsal).toContainText(title)
    await expect(rehearsal).toContainText('2 May 2030')
    type Rehearsal = { id: string; event_id: string | null; rehearsal_date: string }
    const rehearsalRow = async () => (await serviceSelect<Rehearsal[]>(`worship_rehearsals?select=id,event_id,rehearsal_date&notes=like.${encodeURIComponent(`${notes}*`)}`))[0]
    expect(await rehearsalRow()).toMatchObject({ event_id: saved.id, rehearsal_date: '2030-05-02' })

    await editRow(page, rehearsal, 'rehearsal', async (d) => {
      await d.getByLabel('For service').selectOption('')
      await d.getByLabel('Notes').fill(`${notes} moved`)
    })
    await expect(rehearsal).toContainText('General rehearsal')
    expect(await rehearsalRow()).toMatchObject({ event_id: null })

    await deleteRow(page, rehearsal, 'rehearsal')
    expect(await serviceSelect<unknown[]>(`worship_rehearsals?select=id&notes=like.${encodeURIComponent(`${notes}*`)}`)).toHaveLength(0)

    await openTab(page, 'Services')
    const again = await findRow(page, 'Services', 'Search by title or place', title)
    await deleteRow(page, again, 'service')
    await expect(page.getByText('Service deleted')).toBeVisible()
    expect(await serviceSelect<unknown[]>(`worship_events?select=id&id=eq.${saved.id}`)).toHaveLength(0)
  })

  test('creates a team, puts a member on it, changes their role and removes them', async ({ page }) => {
    const team = unique('E2E Team')
    const elderId = await profileId(elder.email)

    await page.goto(`${URL}#teams`)
    await expect(page.getByRole('tab', { name: 'Teams', exact: true })).toHaveAttribute('aria-selected', 'true')
    await addRow(page, 'team', async (d) => {
      await d.getByLabel('Name').fill(team)
      await d.getByLabel('Description').fill('Sunday morning')
    })
    const teamRow = await findRow(page, 'Teams', 'Search teams', team)
    await expect(teamRow).toContainText('Nobody yet')
    const [{ id: teamId }] = await serviceSelect<{ id: string }[]>(`worship_teams?select=id&name=eq.${encodeURIComponent(team)}`)

    await editRow(page, teamRow, 'team', (d) => d.getByLabel('Description').fill('Sunday evening'))
    await expect(teamRow).toContainText('Sunday evening')
    expect(await serviceSelect(`worship_teams?select=description&id=eq.${teamId}`)).toEqual([{ description: 'Sunday evening' }])

    await openTab(page, 'Team members')
    await addRow(page, 'team member', async (d) => {
      await d.getByLabel('Team').selectOption({ label: team })
      await pickMember(d, 'Member', elder)
      await d.getByLabel('Serves as').fill('Keyboard')
    })
    const member = await findRow(page, 'Team members', 'Search by name', team, elder.lastName)
    await expect(member).toContainText(elderName)
    await expect(member).toContainText('Keyboard')
    const membership = () => serviceSelect<{ role: string }[]>(`worship_team_members?select=role&team_id=eq.${teamId}&member_id=eq.${elderId}`)
    expect(await membership()).toEqual([{ role: 'Keyboard' }])

    // The same person can't be added to the same team twice.
    const twice = await page.request.post('/api/worship-team-members', { data: { team_id: teamId, member_id: elderId } })
    expect(twice.status()).toBe(409)

    await editRow(page, member, 'team member', (d) => d.getByLabel('Serves as').fill('Worship leader'))
    await expect(member).toContainText('Worship leader')
    expect(await membership()).toEqual([{ role: 'Worship leader' }])

    await openTab(page, 'Teams')
    await expect(await findRow(page, 'Teams', 'Search teams', team)).toContainText('1 person')

    await openTab(page, 'Team members')
    const again = await findRow(page, 'Team members', 'Search by name', team, elder.lastName)
    await deleteRow(page, again, 'team member', 'Remove')
    expect(await membership()).toEqual([])

    await openTab(page, 'Teams')
    await deleteRow(page, await findRow(page, 'Teams', 'Search teams', team), 'team')
    expect(await serviceSelect<unknown[]>(`worship_teams?select=id&id=eq.${teamId}`)).toHaveLength(0)
  })

  test('lists equipment, marks an item in repair and deletes it', async ({ page }) => {
    const item = unique('E2E Mixer')
    await page.goto(`${URL}#equipment`)
    await addRow(page, 'equipment item', async (d) => {
      await d.getByLabel('Item').fill(item)
      await expect(d.getByLabel('Status')).toHaveValue('available')
      await d.getByLabel('Description').fill('Sound booth')
    })
    const row = await findRow(page, 'Equipment', 'Search equipment', item)
    await expect(row).toContainText('Available')
    const saved = () => serviceSelect<{ id: string; status: string; description: string }[]>(`worship_equipment?select=id,status,description&name=eq.${encodeURIComponent(item)}`)
    expect(await saved()).toMatchObject([{ status: 'available', description: 'Sound booth' }])

    await editRow(page, row, 'equipment item', (d) => d.getByLabel('Status').selectOption('in_repair'))
    await expect(row).toContainText('In repair')
    expect(await saved()).toMatchObject([{ status: 'in_repair' }])

    await deleteRow(page, row, 'equipment item')
    expect(await saved()).toEqual([])
  })
})

test.describe('stage & worship workspace (ministry leader)', () => {
  test.use({ storageState: authFile('ministry_leader') })

  test('may plan services and teams (staff)', async ({ page }) => {
    const created = await page.request.post('/api/worship-teams', { data: { name: unique('E2E Leader team') } })
    expect(created.status()).toBe(201)
    const { id } = (await created.json()) as { id: string }
    expect((await page.request.delete(`/api/worship-teams/${id}`)).status()).toBe(200)
    expect((await page.request.get('/api/worship-equipment')).status()).toBe(200)
  })
})

test.describe('stage & worship workspace on a phone (admin)', () => {
  test.use({ storageState: authFile('admin'), viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('fits the screen, with cards instead of a table', async ({ page }) => {
    const title = unique('E2E Phone service')
    const created = await page.request.post('/api/worship-events', { data: { title, event_date: '2030-06-01', location: 'Phone hall' } })
    expect(created.status()).toBe(201)
    const { id } = (await created.json()) as { id: string }
    try {
      await page.goto(`${URL}#services`)
      await page.getByRole('searchbox', { name: 'Search by title or place' }).fill(title)
      const cards = page.getByRole('list', { name: 'Services' })
      await expect(cards.getByRole('listitem').filter({ hasText: title })).toContainText('1 Jun 2030')
      await expect(page.getByRole('table', { name: 'Services' })).toBeHidden()
      expect(await fitsWidth(page)).toBe(true)
      for (const tab of ['Teams', 'Team members', 'Rehearsals', 'Equipment']) {
        await openTab(page, tab)
        expect(await fitsWidth(page), tab).toBe(true)
      }
    } finally {
      await page.request.delete(`/api/worship-events/${id}`)
    }
  })
})

test.describe('stage & worship workspace (member)', () => {
  test.use({ storageState: authFile('member') })

  test('is refused by the write APIs and the staff-only lists', async ({ page }) => {
    const memberId = await profileId(TEST_USERS.member.email)
    const writes = [
      page.request.post('/api/worship-events', { data: { title: unique('E2E Member service'), event_date: '2030-05-04' } }),
      page.request.post('/api/worship-teams', { data: { name: unique('E2E Member team') } }),
      page.request.post('/api/worship-team-members', { data: { team_id: ZERO, member_id: memberId } }),
      page.request.post('/api/worship-rehearsals', { data: { rehearsal_date: '2030-05-04' } }),
      page.request.post('/api/worship-equipment', { data: { name: unique('E2E Member item') } }),
      page.request.patch(`/api/worship-events/${ZERO}`, { data: { title: 'x' } }),
      page.request.patch(`/api/worship-teams/${ZERO}`, { data: { name: 'x' } }),
      page.request.delete(`/api/worship-team-members/${ZERO}`),
      page.request.delete(`/api/worship-rehearsals/${ZERO}`),
      page.request.patch(`/api/worship-equipment/${ZERO}`, { data: { status: 'retired' } }),
    ]
    for (const res of await Promise.all(writes)) expect(res.status(), res.url()).toBe(403)
    for (const path of ['/api/worship-team-members', '/api/worship-rehearsals', '/api/worship-equipment']) {
      expect((await page.request.get(path)).status(), path).toBe(403)
    }
    // Services and teams are open to every member (RLS: member-readable).
    expect((await page.request.get('/api/worship-events')).status()).toBe(200)
    expect((await page.request.get('/api/worship-teams')).status()).toBe(200)

    await page.goto(URL)
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
