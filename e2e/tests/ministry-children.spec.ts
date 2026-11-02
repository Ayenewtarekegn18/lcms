import { randomUUID } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'
import { authFile, serviceSelect } from '../helpers'
import { TEST_USERS } from '../users'

// Children's Ministry workspace (docs/MINISTRY_WORKSPACES.md): classes, teachers, curriculum and the
// class register, all through their API routes. Classes and curriculum are member-readable; teachers
// and attendance are staff only; only staff write.

const unique = (label: string) =>
  `${label} ${test.info().testId.slice(0, 6)}${test.info().retry}-${randomUUID().slice(0, 8)}`

const ZERO = '00000000-0000-0000-0000-000000000000'
const DAY = '2030-05-04'

const fitsWidth = (page: Page) =>
  page.evaluate(() => {
    const main = document.getElementById('main-content')
    return document.documentElement.scrollWidth <= window.innerWidth + 1 && !!main && main.scrollWidth <= main.clientWidth + 1
  })

const profileId = async (email: string) =>
  (await serviceSelect<{ id: string }[]>(`profiles?select=id&email=eq.${encodeURIComponent(email)}`))[0].id

async function pickMember(scope: ReturnType<Page['getByRole']>, label: RegExp, user: { firstName: string; lastName: string }) {
  await scope.getByLabel(label).fill(user.lastName)
  await scope.getByRole('list', { name: 'Matching members' }).getByRole('button', { name: new RegExp(`${user.firstName} ${user.lastName}`) }).click()
}

test.describe('children ministry (admin)', () => {
  test.use({ storageState: authFile('admin') })

  test('classes, teachers, curriculum and the register, each saved in the database', async ({ page }) => {
    test.setTimeout(120_000)
    const className = unique('E2E Class')
    const lessonTitle = unique('E2E Lesson')
    const elder = TEST_USERS.elder
    const child = TEST_USERS.member
    const elderId = await profileId(elder.email)
    const childId = await profileId(child.email)
    let classId: string | undefined

    try {
      // Classes: add, then edit.
      await page.goto('/dashboard/ministry/children#classes')
      await expect(page.getByRole('heading', { name: 'Children Ministry' })).toBeVisible()
      await page.getByRole('button', { name: 'Add class' }).first().click()
      const add = page.getByRole('dialog', { name: 'Add class' })
      await add.getByLabel('Name').fill(className)
      await add.getByLabel('Age group').fill('4–6')
      await add.getByLabel('When').fill('Sundays 10:00')
      await add.getByLabel('Where').fill('Room 2')
      await add.getByRole('button', { name: 'Add', exact: true }).click()
      await expect(add).toBeHidden()
      await page.getByRole('searchbox', { name: 'Search classes' }).fill(className)
      const classRow = page.getByRole('table', { name: 'Classes' }).getByRole('row').filter({ hasText: className })
      await expect(classRow).toContainText('Sundays 10:00')
      const [saved] = await serviceSelect<{ id: string; age_group: string; location: string }[]>(
        `children_classes?select=id,age_group,location&name=eq.${encodeURIComponent(className)}`,
      )
      classId = saved.id
      expect(saved).toMatchObject({ age_group: '4–6', location: 'Room 2' })

      await classRow.getByRole('button', { name: `Edit ${className}` }).click()
      const edit = page.getByRole('dialog', { name: 'Edit class' })
      await edit.getByLabel('Age group').fill('7–9')
      await edit.getByRole('button', { name: 'Save changes' }).click()
      await expect(edit).toBeHidden()
      await expect(classRow).toContainText('7–9')
      expect((await serviceSelect<{ age_group: string }[]>(`children_classes?select=age_group&id=eq.${classId}`))[0].age_group).toBe('7–9')

      // Teachers: add the elder to the class, change the role, remove.
      await page.getByRole('tab', { name: 'Teachers' }).click()
      await page.getByRole('button', { name: 'Add teacher' }).first().click()
      const teacher = page.getByRole('dialog', { name: 'Add teacher' })
      await pickMember(teacher, /^Teacher/, elder)
      await teacher.getByLabel('Class').selectOption({ label: className })
      await teacher.getByLabel('Role').selectOption('lead')
      await teacher.getByRole('button', { name: 'Add', exact: true }).click()
      await expect(teacher).toBeHidden()
      const teachers = () => serviceSelect<{ id: string; role: string }[]>(`children_class_teachers?select=id,role&class_id=eq.${classId}&member_id=eq.${elderId}`)
      expect(await teachers()).toMatchObject([{ role: 'lead' }])

      await page.getByLabel('Class', { exact: true }).selectOption({ label: className })
      const label = `${elder.firstName} ${elder.lastName} (${className})`
      const teacherRow = page.getByRole('table', { name: 'Teachers' }).getByRole('row').filter({ hasText: elder.lastName })
      await expect(teacherRow).toContainText('Lead teacher')
      await teacherRow.getByRole('button', { name: `Edit ${label}` }).click()
      const editTeacher = page.getByRole('dialog', { name: 'Edit teacher' })
      await editTeacher.getByLabel('Role').selectOption('assistant')
      await editTeacher.getByRole('button', { name: 'Save changes' }).click()
      await expect(editTeacher).toBeHidden()
      await expect(teacherRow).toContainText('Assistant')
      expect(await teachers()).toMatchObject([{ role: 'assistant' }])

      await teacherRow.getByRole('button', { name: `Remove ${label}` }).click()
      await page.getByRole('dialog', { name: 'Remove this teacher?' }).getByRole('button', { name: 'Remove' }).click()
      await expect(page.getByText('Teacher removed')).toBeVisible()
      await expect(page.getByRole('table', { name: 'Teachers' }).getByRole('row').filter({ hasText: elder.lastName })).toHaveCount(0)
      expect(await teachers()).toHaveLength(0)

      // Curriculum: a lesson for the class, then delete it.
      await page.getByRole('tab', { name: 'Curriculum' }).click()
      await page.getByRole('button', { name: 'Add lesson' }).first().click()
      const lesson = page.getByRole('dialog', { name: 'Add lesson' })
      await lesson.getByLabel('Title').fill(lessonTitle)
      await lesson.getByLabel('Class').selectOption({ label: className })
      await lesson.getByLabel('Description').fill('Noah and the ark')
      await lesson.getByLabel('Material link').fill('https://example.org/noah')
      await lesson.getByRole('button', { name: 'Add', exact: true }).click()
      await expect(lesson).toBeHidden()
      await page.getByRole('searchbox', { name: 'Search lessons' }).fill(lessonTitle)
      const lessonRow = page.getByRole('table', { name: 'Curriculum' }).getByRole('row').filter({ hasText: lessonTitle })
      await expect(lessonRow).toContainText(className)
      const [savedLesson] = await serviceSelect<{ id: string; class_id: string; url: string }[]>(
        `children_curriculum?select=id,class_id,url&title=eq.${encodeURIComponent(lessonTitle)}`,
      )
      expect(savedLesson).toMatchObject({ class_id: classId, url: 'https://example.org/noah' })
      await lessonRow.getByRole('button', { name: `Delete ${lessonTitle}` }).click()
      await page.getByRole('dialog', { name: 'Delete this lesson?' }).getByRole('button', { name: 'Delete' }).click()
      await expect(page.getByText('Lesson deleted')).toBeVisible()
      expect(await serviceSelect<unknown[]>(`children_curriculum?select=id&id=eq.${savedLesson.id}`)).toHaveLength(0)

      // Class attendance: add a child to the day's register, mark them absent, clear the mark.
      await page.getByRole('tab', { name: 'Class attendance' }).click()
      await page.getByLabel('Class', { exact: true }).selectOption({ label: className })
      await page.getByLabel('Day').fill(DAY)
      await expect(page.getByText('No children on this register yet.')).toBeVisible()
      await page.getByRole('button', { name: 'Add child' }).first().click()
      const addChild = page.getByRole('dialog', { name: 'Add child' })
      await pickMember(addChild, /^Child/, child)
      await addChild.getByRole('button', { name: 'Add to register' }).click()
      await expect(addChild).toBeHidden()
      const childName = `${child.firstName} ${child.lastName}`
      const marks = () => serviceSelect<{ id: string; status: string }[]>(
        `children_attendance?select=id,status&class_id=eq.${classId}&member_id=eq.${childId}&attendance_date=eq.${DAY}`,
      )
      const register = page.getByRole('list', { name: 'Register' }).getByRole('listitem').filter({ hasText: childName })
      await expect(register.getByRole('button', { name: 'Present' })).toHaveAttribute('aria-pressed', 'true')
      expect(await marks()).toMatchObject([{ status: 'present' }])

      await register.getByRole('button', { name: 'Absent' }).click()
      await expect(register.getByRole('button', { name: 'Absent' })).toHaveAttribute('aria-pressed', 'true')
      await expect(page.getByTestId('register-summary')).toContainText('0 present · 1 absent')
      expect(await marks()).toMatchObject([{ status: 'absent' }])

      await register.getByRole('button', { name: `Clear the mark for ${childName}` }).click()
      await expect(page.getByText('No children on this register yet.')).toBeVisible()
      expect(await marks()).toHaveLength(0)

      // Delete the class after confirming.
      await page.getByRole('tab', { name: 'Classes' }).click()
      await page.getByRole('searchbox', { name: 'Search classes' }).fill(className)
      await page.getByRole('table', { name: 'Classes' }).getByRole('button', { name: `Delete ${className}` }).click()
      const confirm = page.getByRole('dialog', { name: 'Delete this class?' })
      await expect(confirm).toContainText('teachers and attendance')
      await confirm.getByRole('button', { name: 'Delete' }).click()
      await expect(page.getByText('Class deleted')).toBeVisible()
      expect(await serviceSelect<unknown[]>(`children_classes?select=id&id=eq.${classId}`)).toHaveLength(0)
      classId = undefined
    } finally {
      if (classId) await page.request.delete(`/api/children-classes/${classId}`)
    }
  })
})

test.describe('children ministry on a phone (admin)', () => {
  test.use({ storageState: authFile('admin'), viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('every tab fits the screen, with cards instead of a table', async ({ page }) => {
    const name = unique('E2E Phone class')
    const created = await page.request.post('/api/children-classes', { data: { name, age_group: '10–12', location: 'Hall' } })
    expect(created.status()).toBe(201)
    const { id } = (await created.json()) as { id: string }
    const childId = await profileId(TEST_USERS.member.email)
    expect((await page.request.post('/api/children-attendance', { data: { class_id: id, member_id: childId, attendance_date: DAY } })).status()).toBe(201)

    try {
      await page.goto('/dashboard/ministry/children#classes')
      await page.getByRole('searchbox', { name: 'Search classes' }).fill(name)
      const cards = page.getByRole('list', { name: 'Classes' })
      await expect(cards.getByRole('listitem').filter({ hasText: name })).toContainText('10–12')
      await expect(page.getByRole('table', { name: 'Classes' })).toBeHidden()
      expect(await fitsWidth(page)).toBe(true)

      for (const tab of ['Teachers', 'Curriculum']) {
        await page.getByRole('tab', { name: tab }).click()
        await expect(page.getByRole('button', { name: tab === 'Teachers' ? 'Add teacher' : 'Add lesson' }).first()).toBeVisible()
        expect(await fitsWidth(page), tab).toBe(true)
      }

      await page.getByRole('tab', { name: 'Class attendance' }).click()
      await page.getByLabel('Class', { exact: true }).selectOption({ label: name })
      await page.getByLabel('Day').fill(DAY)
      await expect(page.getByRole('list', { name: 'Register' }).getByRole('listitem')).toHaveCount(1)
      expect(await fitsWidth(page)).toBe(true)
    } finally {
      await page.request.delete(`/api/children-classes/${id}`)
    }
  })
})

test.describe('children ministry (ministry leader)', () => {
  test.use({ storageState: authFile('ministry_leader') })

  test('may run classes (staff write)', async ({ page }) => {
    const res = await page.request.post('/api/children-classes', { data: { name: unique('E2E Leader class') } })
    expect(res.status()).toBe(201)
    const { id } = (await res.json()) as { id: string }
    expect((await page.request.patch(`/api/children-classes/${id}`, { data: { location: 'Room 5' } })).status()).toBe(200)
    expect((await page.request.delete(`/api/children-classes/${id}`)).status()).toBe(200)
  })
})

test.describe('children ministry (member)', () => {
  test.use({ storageState: authFile('member') })

  test('is refused by the write APIs and the staff-only lists', async ({ page }) => {
    const memberId = await profileId(TEST_USERS.member.email)
    const writes = [
      page.request.post('/api/children-classes', { data: { name: unique('E2E Member class') } }),
      page.request.post('/api/children-class-teachers', { data: { class_id: ZERO, member_id: memberId } }),
      page.request.post('/api/children-curriculum', { data: { title: unique('E2E Member lesson') } }),
      page.request.post('/api/children-attendance', { data: { class_id: ZERO, member_id: memberId, attendance_date: DAY } }),
      page.request.patch(`/api/children-classes/${ZERO}`, { data: { name: 'x' } }),
      page.request.delete(`/api/children-class-teachers/${ZERO}`),
      page.request.patch(`/api/children-curriculum/${ZERO}`, { data: { title: 'x' } }),
      page.request.patch(`/api/children-attendance/${ZERO}`, { data: { status: 'absent' } }),
      page.request.delete(`/api/children-attendance/${ZERO}`),
    ]
    for (const res of await Promise.all(writes)) expect(res.status(), res.url()).toBe(403)
    expect((await page.request.get('/api/children-class-teachers')).status()).toBe(403)
    expect((await page.request.get(`/api/children-attendance?class_id=${ZERO}`)).status()).toBe(403)
    // Classes and curriculum are member-readable.
    expect((await page.request.get('/api/children-classes')).status()).toBe(200)
    expect((await page.request.get('/api/children-curriculum')).status()).toBe(200)

    await page.goto('/dashboard/ministry/children')
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
