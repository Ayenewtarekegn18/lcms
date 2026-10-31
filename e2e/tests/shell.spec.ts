import { expect, test, type Page } from '@playwright/test'
import { PAGE_ACCESS } from '../../lib/auth/roles'
import { TEST_USERS, type TestRole } from '../users'
import { authFile } from '../helpers'

// The app shell: fixed sidebar on desktop, top bar + drawer on phones. Runs in the desktop and the
// mobile project (playwright.config.ts). Read-only: these tests only open pages.

const nav = (page: Page) => page.getByRole('navigation', { name: 'Main navigation' })
const menuButton = (page: Page) => page.getByRole('button', { name: 'Open menu' })
const drawer = (page: Page) => page.getByRole('dialog', { name: 'Menu' })

// <main> is the scroll container, so overflow can hide inside it without widening the document.
const fitsWidth = () => {
  const main = document.getElementById('main-content')
  return (
    document.documentElement.scrollWidth <= window.innerWidth + 1 &&
    !!main && main.scrollWidth <= main.clientWidth + 1
  )
}

test.describe('desktop', () => {
  test.use({ storageState: authFile('admin') })

  test('shows the sidebar navigation and no menu button', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop layout')
    await page.goto('/dashboard')
    await expect(nav(page)).toBeVisible()
    await expect(nav(page).getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page')
    await expect(menuButton(page)).toBeHidden()
  })
})

test.describe('phone', () => {
  test.describe('as admin', () => {
    test.use({ storageState: authFile('admin') })

    test('shows the menu button instead of the sidebar', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'phone layout')
      await page.goto('/dashboard')
      await expect(menuButton(page)).toBeVisible()
      const box = await menuButton(page).boundingBox()
      expect(box!.width).toBeGreaterThanOrEqual(44)
      expect(box!.height).toBeGreaterThanOrEqual(44)
      await expect(nav(page)).toBeHidden()
    })

    test('a link in the drawer navigates and closes it', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'phone layout')
      await page.goto('/dashboard')
      await menuButton(page).click()
      await expect(drawer(page)).toBeVisible()
      await drawer(page).getByRole('link', { name: 'Members' }).click()
      await expect(page).toHaveURL(/\/dashboard\/members$/)
      await expect(drawer(page)).toBeHidden()
      await expect(menuButton(page)).toBeVisible()
    })

    test('Escape closes the drawer and focus returns to the menu button', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'phone layout')
      await page.goto('/dashboard')
      await menuButton(page).click()
      await expect(drawer(page)).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(drawer(page)).toBeHidden()
      await expect(menuButton(page)).toBeFocused()
    })

    test('the close button and the overlay close the drawer', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'phone layout')
      await page.goto('/dashboard')
      await menuButton(page).click()
      await drawer(page).getByRole('button', { name: 'Close menu' }).click()
      await expect(drawer(page)).toBeHidden()
      await menuButton(page).click()
      await expect(drawer(page)).toBeVisible()
      const viewport = page.viewportSize()!
      await page.mouse.click(viewport.width - 10, viewport.height / 2) // overlay, right of the drawer
      await expect(drawer(page)).toBeHidden()
    })

    for (const width of [360, 390]) {
      test(`/dashboard has no horizontal scroll at ${width}px`, async ({ page, isMobile }) => {
        test.skip(!isMobile, 'phone layout')
        await page.setViewportSize({ width, height: 800 })
        await page.goto('/dashboard')
        await expect(menuButton(page)).toBeVisible()
        expect(await page.evaluate(fitsWidth)).toBe(true)
      })
    }

    test('the skip link is the first Tab stop and moves focus to main', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'phone layout')
      await page.goto('/dashboard')
      await expect(menuButton(page)).toBeVisible()
      await page.keyboard.press('Tab')
      const skip = page.getByRole('link', { name: 'Skip to main content' })
      await expect(skip).toBeFocused()
      expect((await skip.boundingBox())!.width).toBeGreaterThan(20) // shown while focused
      await page.keyboard.press('Enter')
      await expect(page.locator('#main-content')).toBeFocused()
    })
  })

  // Which links each role gets comes from PAGE_ACCESS (admin sees Members and Financial; member does not).
  for (const role of Object.keys(TEST_USERS) as TestRole[]) {
    test.describe(`as ${role}`, () => {
      test.use({ storageState: authFile(role) })

      test('the drawer lists the links the role may open', async ({ page, isMobile }) => {
        test.skip(!isMobile, 'phone layout')
        await page.goto('/dashboard')
        await menuButton(page).click()
        await expect(drawer(page)).toBeVisible()
        await expect(drawer(page).getByRole('link', { name: 'Dashboard' })).toBeVisible()
        for (const [section, name] of [['members', 'Members'], ['financial', 'Financial']] as const) {
          const allowed = (PAGE_ACCESS[section] as readonly string[]).includes(role)
          await expect(drawer(page).getByRole('link', { name, exact: true })).toHaveCount(allowed ? 1 : 0)
        }
        await expect(drawer(page).getByText(TEST_USERS[role].email)).toBeVisible()
      })
    })
  }
})
