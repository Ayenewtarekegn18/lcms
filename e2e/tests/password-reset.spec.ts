import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { SUPABASE_URL } from '../helpers'

// Password reset end to end: ask for the link on the sign-in page, open it from the local stack's
// test inbox (Mailpit), choose a new password and land on the dashboard. A throwaway account is
// used, so the shared test logins keep their password.

const MAILPIT = process.env.MAILPIT_URL ?? 'http://127.0.0.1:54324'
const NEW_PASSWORD = 'Kale-Hiwot-Reset-2026'

const admin = async (method: string, path: string, body?: unknown) => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY missing: run npm run local:start first')
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin${path}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${await res.text()}`)
  return res.json()
}

/** The reset link in the newest email to `to`, waiting for it to arrive. */
async function resetLink(to: string): Promise<string> {
  let link = ''
  await expect.poll(async () => {
    const search = await (await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`)).json()
    const id = search.messages?.[0]?.ID
    if (!id) return ''
    const message = await (await fetch(`${MAILPIT}/api/v1/message/${id}`)).json()
    link = (/https?:\/\/[^\s"<>]+\/auth\/v1\/verify\?[^\s"<>]+/.exec(message.HTML || message.Text)?.[0] ?? '').replaceAll('&amp;', '&')
    return link
  }, { timeout: 20_000 }).not.toBe('')
  return link
}

test.describe('password reset', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('emails a link that lets the person choose a new password', async ({ page }) => {
    const email = `reset-${randomUUID().slice(0, 8)}@lkhc.test`
    const user = await admin('POST', '/users', { email, password: 'Old-Password-123', email_confirm: true })
    try {
      await page.goto('/auth/login')
      await page.getByRole('link', { name: 'Forgot your password?' }).click()
      await page.getByLabel('Email Address').fill(email)
      await page.getByRole('button', { name: 'Send the reset link' }).click()
      await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible()

      await page.goto(await resetLink(email))
      await expect(page.getByRole('heading', { name: 'Choose a new password' })).toBeVisible()
      await expect(page).toHaveURL(/\/auth\/update-password$/) // the one-time code is gone from the address bar

      await page.getByLabel('New password').fill('too-short')
      await page.getByLabel('Type it again').fill('too-short')
      await page.getByRole('button', { name: 'Save and sign in' }).click()
      await expect(page.locator('form').getByRole('alert')).toContainText('12 characters')

      await page.getByLabel('New password').fill(NEW_PASSWORD)
      await page.getByLabel('Type it again').fill(NEW_PASSWORD)
      await page.getByRole('button', { name: 'Save and sign in' }).click()
      await page.waitForURL('**/dashboard')

      // The new password works for a normal sign-in.
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: NEW_PASSWORD }),
      })
      expect(res.status).toBe(200)
    } finally {
      await admin('DELETE', `/users/${user.id}`)
    }
  })

  test('a used, expired or missing link asks for a new one', async ({ page }) => {
    await page.goto('/auth/update-password')
    await expect(page.getByRole('heading', { name: 'This link has expired' })).toBeVisible()
    await page.getByRole('link', { name: 'Send a new link' }).click()
    await expect(page).toHaveURL(/\/auth\/forgot-password$/)
  })
})
