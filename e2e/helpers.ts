import type { Page } from '@playwright/test'
import { E2E_PASSWORD, E2E_USERS, type E2ERole } from './users'

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321'
export const authFile = (role: E2ERole) => `e2e/.auth/${role}.json`

export async function signIn(page: Page, role: E2ERole) {
  await page.goto('/auth/login')
  await page.locator('#email').fill(E2E_USERS[role])
  await page.locator('#password').fill(E2E_PASSWORD)
  await page.locator('form button[type="submit"]').click()
  await page.waitForURL('**/dashboard')
}

/** Read rows straight from PostgREST as service_role (test stack only) to check what was saved. */
export async function serviceSelect<T>(path: string): Promise<T> {
  const key = process.env.E2E_SERVICE_ROLE_KEY
  if (!key) throw new Error('E2E_SERVICE_ROLE_KEY missing: export $(node e2e/stack/keys.mjs)')
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`)
  return res.json() as Promise<T>
}
