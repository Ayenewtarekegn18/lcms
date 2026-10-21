import { expect, test } from '@playwright/test'
import { authFile } from '../helpers'
import { TEST_USERS } from '../users'

// Runs on desktop and on a phone viewport (playwright.config.ts → projects).
const noHorizontalScroll = () => document.documentElement.scrollWidth <= window.innerWidth + 1

test('login page renders and fits the screen', async ({ page }) => {
  await page.goto('/auth/login')
  await expect(page.locator('#email')).toBeVisible()
  await expect(page.locator('#password')).toBeVisible()
  expect(await page.evaluate(noHorizontalScroll)).toBe(true)
})

test('wrong password shows an error and stays on the login page', async ({ page }) => {
  await page.goto('/auth/login')
  await page.locator('#email').fill(TEST_USERS.member.email)
  await page.locator('#password').fill('not-the-password')
  await page.locator('form button[type="submit"]').click()
  await expect(page.getByText('Invalid email or password. Please try again.')).toBeVisible()
  await expect(page).toHaveURL(/\/auth\/login$/)
})

test.describe('signed in', () => {
  test.use({ storageState: authFile('admin') })

  test('dashboard renders without errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible()
    expect(errors).toEqual([])
  })

  test('registration form fits the screen', async ({ page }) => {
    await page.goto('/dashboard/members/register')
    await expect(page.locator('#firstNameAm')).toBeVisible()
    expect(await page.evaluate(noHorizontalScroll)).toBe(true)
  })
})
