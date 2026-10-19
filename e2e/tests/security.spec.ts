import { expect, test } from '@playwright/test'
import { authFile, SUPABASE_URL } from '../helpers'

// Regression tests for the Phase 0/1 findings (docs/REMEDIATION_GUIDE.md).
test.describe('as a plain member', () => {
  test.use({ storageState: authFile('member') })

  test('cannot make themselves admin through the profile API', async ({ page }) => {
    for (const body of [{ is_admin: true }, { role: 'admin' }, { first_name: 'x', is_active: true }]) {
      const res = await page.request.patch('/api/profile', { data: body })
      expect(res.status(), JSON.stringify(body)).toBe(400)
    }
    const me = await (await page.request.get('/api/profile')).json()
    expect(me.role).toBe('member')
  })

  test('cannot read the ledger, the audit log or the registry', async ({ page }) => {
    expect((await page.request.get('/api/financial')).status()).toBe(403)
    expect((await page.request.get('/api/audit-log')).status()).toBe(403)
    expect((await page.request.get('/api/members/register')).status()).toBe(403)
    expect((await page.request.post('/api/members/register', { data: {} })).status()).toBe(403)
  })

  test('the audit log cannot be written through the API', async ({ page }) => {
    expect((await page.request.post('/api/audit-log', { data: { action: 'forged' } })).status()).toBe(405)
  })
})

test('the anon key alone reads no member data', async ({ request }) => {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  for (const table of ['profiles', 'member_details', 'financial_transactions', 'audit_log']) {
    const res = await request.get(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`, { headers: { apikey: anon, Authorization: `Bearer ${anon}` } })
    // 401 = no grant for anon; 200 with [] would mean RLS hid everything (also acceptable)
    if (res.status() === 200) expect(await res.json(), table).toEqual([])
    else expect(res.status(), table).toBe(401)
  }
})

test('API errors do not leak table or column names', async ({ page }) => {
  const res = await page.request.patch('/api/profile', { data: { first_name: 'x' } })
  expect(res.status()).toBe(401)
  expect(await res.text()).not.toMatch(/profiles|column|relation/i)
})

test('keep-warm endpoint reaches the database', async ({ request }) => {
  const res = await request.get('/api/keepalive')
  expect(res.status()).toBe(200)
  expect(res.headers()['cache-control']).toContain('no-store')
  const body = await res.json()
  expect(body.ok).toBe(true)
  expect(Date.parse(body.db_time)).not.toBeNaN()
})
