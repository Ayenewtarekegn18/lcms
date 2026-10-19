// Create one confirmed test user per role on the e2e stack (idempotent). Prints nothing secret.
import { E2E_PASSWORD, E2E_USERS } from '../users.ts'

const base = process.env.E2E_SUPABASE_URL ?? 'http://127.0.0.1:54321'
const key = process.env.E2E_SERVICE_ROLE_KEY
if (!key) { console.error('E2E_SERVICE_ROLE_KEY missing: export $(node e2e/stack/keys.mjs)'); process.exit(1) }
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }

for (const [role, email] of Object.entries(E2E_USERS)) {
  const created = await fetch(`${base}/auth/v1/admin/users`, {
    method: 'POST', headers,
    body: JSON.stringify({ email, password: E2E_PASSWORD, email_confirm: true, user_metadata: { first_name: role, last_name: 'E2E' } }),
  })
  if (!created.ok && created.status !== 422) throw new Error(`create ${email}: ${created.status} ${await created.text()}`)
  const set = await fetch(`${base}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}`, {
    method: 'PATCH', headers: { ...headers, Prefer: 'return=minimal' }, body: JSON.stringify({ role }),
  })
  if (!set.ok) throw new Error(`role for ${email}: ${set.status} ${await set.text()}`)
  console.log(`seeded ${role.padEnd(16)} ${email}`)
}
