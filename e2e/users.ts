// Test accounts on the local stack (npm run local:start creates them), used for local development and
// by the end-to-end tests. Test-only credentials: they exist only on your machine and in CI.
export const TEST_PASSWORD = 'Local-Test-Password-1'

export const TEST_USERS = {
  admin: { email: 'admin@lkhc.test', firstName: 'Abeba', lastName: 'Admin' },
  elder: { email: 'elder@lkhc.test', firstName: 'Kebede', lastName: 'Elder' },
  ministry_leader: { email: 'leader@lkhc.test', firstName: 'Meron', lastName: 'Leader' },
  finance: { email: 'finance@lkhc.test', firstName: 'Dawit', lastName: 'Finance' },
  member: { email: 'member@lkhc.test', firstName: 'Hana', lastName: 'Member' },
} as const

export type TestRole = keyof typeof TEST_USERS
