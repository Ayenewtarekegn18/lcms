import { randomUUID } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'
import { authFile, serviceSelect } from '../helpers'
import { TEST_USERS } from '../users'

// Administration workspace (docs/MINISTRY_WORKSPACES.md): the Tasks tab reads and writes admin_tasks
// through /api/admin-tasks, which only staff may use (RLS: admin_tasks is staff-only).

const unique = (label: string) =>
  `${label} ${test.info().testId.slice(0, 6)}${test.info().retry}-${randomUUID().slice(0, 8)}`

const ZERO = '00000000-0000-0000-0000-000000000000'

const fitsWidth = (page: Page) =>
  page.evaluate(() => {
    const main = document.getElementById('main-content')
    return document.documentElement.scrollWidth <= window.innerWidth + 1 && !!main && main.scrollWidth <= main.clientWidth + 1
  })

type Task = { id: string; title: string; assigned_to_id: string | null; due_date: string | null; status: string; notes: string | null }
const savedTask = async (title: string) =>
  serviceSelect<Task[]>(`admin_tasks?select=id,title,assigned_to_id,due_date,status,notes&title=eq.${encodeURIComponent(title)}`)
const profileId = async (email: string) =>
  (await serviceSelect<{ id: string }[]>(`profiles?select=id&email=eq.${encodeURIComponent(email)}`))[0].id

test.describe('administration workspace (admin)', () => {
  test.use({ storageState: authFile('admin') })

  test('adds an overdue task for a member, completes it and deletes it after confirming', async ({ page }) => {
    const title = unique('E2E Task')
    const elder = TEST_USERS.elder
    const elderName = `${elder.firstName} ${elder.lastName}`

    await page.goto('/dashboard/ministry/administration#tasks')
    await expect(page.getByRole('heading', { name: 'Administration', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Tasks' })).toHaveAttribute('aria-selected', 'true')
    await page.getByRole('button', { name: 'Add task' }).first().click()

    const dialog = page.getByRole('dialog', { name: 'Add task' })
    await dialog.getByLabel('Title').fill(title)
    await dialog.getByLabel('Assigned to').fill(elder.lastName)
    await dialog.getByRole('list', { name: 'Matching members' }).getByRole('button', { name: new RegExp(elderName) }).click()
    await dialog.getByLabel('Due').fill('2020-01-15')
    await dialog.getByLabel('Status').selectOption('in_progress')
    await dialog.getByLabel('Notes').fill('Collect the signed forms')
    await dialog.getByRole('button', { name: 'Add', exact: true }).click()
    await expect(page.getByText('Task added')).toBeVisible({ timeout: 20_000 })
    await expect(dialog).toBeHidden()

    const [task] = await savedTask(title)
    expect(task).toMatchObject({ assigned_to_id: await profileId(elder.email), due_date: '2020-01-15', status: 'in_progress', notes: 'Collect the signed forms' })

    await page.getByRole('searchbox', { name: 'Search tasks' }).fill(title)
    const row = page.getByRole('table', { name: 'Tasks' }).getByRole('row').filter({ hasText: title })
    await expect(row).toContainText(elderName)
    await expect(row).toContainText('In progress')
    await expect(row).toContainText('Overdue')

    // Completing it ends "overdue".
    await row.getByRole('button', { name: `Edit ${title}` }).click()
    const edit = page.getByRole('dialog', { name: 'Edit task' })
    await expect(edit.getByLabel('Title')).toHaveValue(title)
    await edit.getByLabel('Status').selectOption('completed')
    await edit.getByRole('button', { name: 'Save changes' }).click()
    await expect(edit).toBeHidden()
    await expect(row).toContainText('Completed')
    await expect(row).not.toContainText('Overdue')
    expect((await savedTask(title))[0]).toMatchObject({ status: 'completed', due_date: '2020-01-15' })

    // Delete: nothing happens until it is confirmed.
    await row.getByRole('button', { name: `Delete ${title}` }).click()
    const confirm = page.getByRole('dialog', { name: 'Delete this task?' })
    await expect(confirm).toContainText(title)
    await confirm.getByRole('button', { name: 'Cancel' }).click()
    expect(await savedTask(title)).toHaveLength(1)
    await row.getByRole('button', { name: `Delete ${title}` }).click()
    await page.getByRole('dialog', { name: 'Delete this task?' }).getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Task deleted')).toBeVisible()
    await expect(row).toHaveCount(0)
    expect(await savedTask(title)).toHaveLength(0)
  })

  test('the API refuses unknown statuses and fields', async ({ page }) => {
    const bad = [
      page.request.post('/api/admin-tasks', { data: { title: unique('E2E Bad'), status: 'done' } }),
      page.request.post('/api/admin-tasks', { data: { title: unique('E2E Bad'), created_at: '2020-01-01' } }),
      page.request.patch(`/api/admin-tasks/${ZERO}`, { data: {} }),
    ]
    for (const res of await Promise.all(bad)) expect(res.status(), res.url()).toBe(400)
    expect((await page.request.get('/api/admin-tasks?status=done')).status()).toBe(400)
  })
})

test.describe('administration workspace on a phone (admin)', () => {
  test.use({ storageState: authFile('admin'), viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('the tasks fit the screen as cards', async ({ page }) => {
    const title = unique('E2E Phone task')
    const created = await page.request.post('/api/admin-tasks', { data: { title, due_date: '2020-02-01', notes: 'A long note '.repeat(20) } })
    expect(created.status()).toBe(201)
    const { id } = (await created.json()) as { id: string }
    try {
      await page.goto('/dashboard/ministry/administration#tasks')
      await page.getByRole('searchbox', { name: 'Search tasks' }).fill(title)
      const cards = page.getByRole('list', { name: 'Tasks' })
      await expect(cards.getByRole('listitem').filter({ hasText: title })).toContainText('Overdue')
      await expect(page.getByRole('table', { name: 'Tasks' })).toBeHidden()
      expect(await fitsWidth(page)).toBe(true)
    } finally {
      await page.request.delete(`/api/admin-tasks/${id}`)
    }
  })
})

test.describe('administration workspace (member)', () => {
  test.use({ storageState: authFile('member') })

  test('is refused by the task API and the page', async ({ page }) => {
    const calls = [
      page.request.get('/api/admin-tasks'),
      page.request.post('/api/admin-tasks', { data: { title: unique('E2E Member task') } }),
      page.request.patch(`/api/admin-tasks/${ZERO}`, { data: { status: 'completed' } }),
      page.request.delete(`/api/admin-tasks/${ZERO}`),
    ]
    for (const res of await Promise.all(calls)) expect(res.status(), res.url()).toBe(403)
    await page.goto('/dashboard/ministry/administration')
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
