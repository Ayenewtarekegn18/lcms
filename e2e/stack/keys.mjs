// Anon and service-role JWTs for the test stack's secret, as KEY=value lines:
//   CI:    node e2e/stack/keys.mjs >> "$GITHUB_ENV"
//   local: export $(node e2e/stack/keys.mjs)
import crypto from 'node:crypto'

const secret = process.env.JWT_SECRET ?? 'e2e-only-jwt-secret-at-least-32-characters-long'
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
const sign = (role) => {
  const head = b64({ alg: 'HS256', typ: 'JWT' })
  const body = b64({ iss: 'lkhc-e2e', role, exp: Math.floor(Date.now() / 1000) + 86400 })
  return `${head}.${body}.${crypto.createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url')}`
}
const anon = sign('anon')
console.log(`E2E_ANON_KEY=${anon}`)
console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon}`)
console.log(`E2E_SERVICE_ROLE_KEY=${sign('service_role')}`)
