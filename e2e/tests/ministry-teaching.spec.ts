import { expect, test } from '@playwright/test'
import { authFile, serviceSelect } from '../helpers'
import { TEST_USERS } from '../users'
import { addRow, deleteRow, editRow, findRow, fitsWidth, openTab, pickMember, profileId, unique, ZERO } from '../workspace'

// Teaching & Seminar workspace: programs, their materials and enrollments, all through the API routes.
// Staff write; a member may read programs and materials, not who is enrolled.

const URL = '/dashboard/ministry/teaching'
const elder = TEST_USERS.elder
const elderName = `${elder.firstName} ${elder.lastName}`

test.describe('teaching workspace (admin)', () => {
  test.use({ storageState: authFile('admin') })

  test('runs a program with a material and an enrollment, then deletes it with both', async ({ page }) => {
    const title = unique('E2E Program')
    const material = unique('E2E Slides')
    const elderId = await profileId(elder.email)
    type Program = { id: string; program_type: string; instructor_id: string; start_date: string; end_date: string | null; max_capacity: number | null; is_active: boolean }
    const program = async () => (await serviceSelect<Program[]>(
      `education_programs?select=id,program_type,instructor_id,start_date,end_date,max_capacity,is_active&title=eq.${encodeURIComponent(title)}`,
    ))[0]

    await page.goto(URL)
    await expect(page.getByRole('heading', { name: 'Teaching & Seminar' })).toBeVisible()
    await openTab(page, 'Programs')
    await addRow(page, 'program', async (d) => {
      await d.getByLabel('Title').fill(title)
      await d.getByLabel('Type').selectOption('seminar')
      await pickMember(d, 'Instructor', elder)
      await d.getByLabel('Starts').fill('2030-02-01')
      await d.getByLabel('Ends').fill('2030-03-15')
      await d.getByLabel('Capacity').fill('20')
    })
    const row = await findRow(page, 'Programs', 'Search programs', title)
    await expect(row).toContainText('Seminar')
    await expect(row).toContainText(elderName)
    await expect(row).toContainText('1 Feb 2030 – 15 Mar 2030')
    await expect(row).toContainText('0 / 20')
    const saved = await program()
    expect(saved).toMatchObject({ program_type: 'seminar', instructor_id: elderId, start_date: '2030-02-01', end_date: '2030-03-15', max_capacity: 20, is_active: true })

    // An end before the start is refused by the API, next to the field.
    await row.getByRole('button', { name: /^Edit / }).click()
    const edit = page.getByRole('dialog', { name: 'Edit program' })
    await edit.getByLabel('Ends').fill('2030-01-01')
    await edit.getByRole('button', { name: 'Save changes' }).click()
    await expect(edit.getByText('The end date is before the start date')).toBeVisible()
    await edit.getByLabel('Ends').fill('2030-04-30')
    await edit.getByLabel('Open (shown to members)').uncheck()
    await edit.getByRole('button', { name: 'Save changes' }).click()
    await expect(edit).toBeHidden()
    await expect(row).toContainText('Closed')
    expect(await program()).toMatchObject({ end_date: '2030-04-30', is_active: false })

    // A material for the program.
    await openTab(page, 'Materials')
    await addRow(page, 'material', async (d) => {
      await d.getByLabel('Program').selectOption({ label: title })
      await d.getByLabel('Title').fill(material)
      await d.getByLabel('Link').fill('https://example.org/slides')
    })
    const materialRow = await findRow(page, 'Materials', 'Search materials', material)
    await expect(materialRow).toContainText(title)
    await expect(materialRow).toContainText('Document')
    const materialSaved = () => serviceSelect<{ program_id: string; material_type: string; url: string }[]>(
      `teaching_materials?select=program_id,material_type,url&title=eq.${encodeURIComponent(material)}`,
    )
    expect(await materialSaved()).toEqual([{ program_id: saved.id, material_type: 'document', url: 'https://example.org/slides' }])
    await editRow(page, materialRow, 'material', (d) => d.getByLabel('Type').selectOption('video'))
    await expect(materialRow).toContainText('Video')
    expect(await materialSaved()).toMatchObject([{ material_type: 'video' }])

    // An enrollment, then its completion.
    await openTab(page, 'Enrollments')
    await addRow(page, 'enrollment', async (d) => {
      await d.getByLabel('Program').selectOption({ label: title })
      await pickMember(d, 'Member', elder)
    })
    const enrolled = await findRow(page, 'Enrollments', 'Search by name', title, elder.lastName)
    await expect(enrolled).toContainText(elderName)
    await expect(enrolled).toContainText('Active')
    const enrollment = () => serviceSelect<{ status: string; grade: string | null; completion_date: string | null; enrollment_date: string }[]>(
      `education_enrollments?select=status,grade,completion_date,enrollment_date&program_id=eq.${saved.id}&member_id=eq.${elderId}`,
    )
    expect(await enrollment()).toMatchObject([{ status: 'active', grade: null }])
    expect((await enrollment())[0].enrollment_date).toMatch(/^\d{4}-\d{2}-\d{2}$/) // the column default (today)

    await editRow(page, enrolled, 'enrollment', async (d) => {
      await d.getByLabel('Status').selectOption('completed')
      await d.getByLabel('Completed').fill('2030-04-30')
      await d.getByLabel('Grade').fill('A')
    })
    await expect(enrolled).toContainText('Completed')
    expect(await enrollment()).toMatchObject([{ status: 'completed', grade: 'A', completion_date: '2030-04-30' }])

    await openTab(page, 'Programs')
    await expect(await findRow(page, 'Programs', 'Search programs', title)).toContainText('1 / 20')

    // Removing the enrollment, then deleting the program takes its material along.
    await openTab(page, 'Enrollments')
    await deleteRow(page, await findRow(page, 'Enrollments', 'Search by name', title, elder.lastName), 'enrollment', 'Remove')
    expect(await enrollment()).toEqual([])

    await openTab(page, 'Programs')
    await deleteRow(page, await findRow(page, 'Programs', 'Search programs', title), 'program')
    expect(await serviceSelect<unknown[]>(`education_programs?select=id&id=eq.${saved.id}`)).toHaveLength(0)
    expect(await materialSaved()).toEqual([])
  })
})

test.describe('teaching workspace on a phone (admin)', () => {
  test.use({ storageState: authFile('admin'), viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('fits the screen, with cards instead of a table', async ({ page }) => {
    const title = unique('E2E Phone program')
    const created = await page.request.post('/api/education-programs', { data: { title, start_date: '2030-06-01', program_type: 'course' } })
    expect(created.status()).toBe(201)
    const { id } = (await created.json()) as { id: string }
    try {
      await page.goto(`${URL}#programs`)
      await page.getByRole('searchbox', { name: 'Search programs' }).fill(title)
      const cards = page.getByRole('list', { name: 'Programs' })
      await expect(cards.getByRole('listitem').filter({ hasText: title })).toContainText('From 1 Jun 2030')
      await expect(page.getByRole('table', { name: 'Programs' })).toBeHidden()
      expect(await fitsWidth(page)).toBe(true)
      for (const tab of ['Materials', 'Enrollments']) {
        await openTab(page, tab)
        expect(await fitsWidth(page), tab).toBe(true)
      }
    } finally {
      await page.request.delete(`/api/education-programs/${id}`)
    }
  })
})

test.describe('teaching workspace (member)', () => {
  test.use({ storageState: authFile('member') })

  test('is refused by the write APIs and the enrollment list', async ({ page }) => {
    const memberId = await profileId(TEST_USERS.member.email)
    const writes = [
      page.request.post('/api/education-programs', { data: { title: unique('E2E Member program'), start_date: '2030-05-04' } }),
      page.request.post('/api/teaching-materials', { data: { program_id: ZERO, title: 'x' } }),
      page.request.post('/api/education-enrollments', { data: { program_id: ZERO, member_id: memberId } }),
      page.request.patch(`/api/education-programs/${ZERO}`, { data: { title: 'x' } }),
      page.request.delete(`/api/teaching-materials/${ZERO}`),
      page.request.patch(`/api/education-enrollments/${ZERO}`, { data: { status: 'completed' } }),
    ]
    for (const res of await Promise.all(writes)) expect(res.status(), res.url()).toBe(403)
    expect((await page.request.get('/api/education-enrollments')).status()).toBe(403)
    expect((await page.request.get('/api/education-programs')).status()).toBe(200)
    expect((await page.request.get('/api/teaching-materials')).status()).toBe(200)

    await page.goto(URL)
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
