#!/usr/bin/env node
// Your own Supabase on this machine (Postgres 17, Auth, Storage, Studio, Mailpit in Docker), with the
// dbmate migrations applied and test data. You build and try changes here, never on staging.
// The CI end-to-end job runs the same script, so this setup can't quietly break.
//
//   npm run local:start    start the stack (or reuse it), migrate, seed, write .env.development.local
//   npm run local:reset    wipe the local database and rebuild it (migrations, then seed)
//   npm run local:stop     stop the stack and remove .env.development.local
//   npm run local:status   addresses and test logins
//
// `npm run dev` reads .env.development.local before .env.local, so while it exists the app talks to
// the local stack. Everything here uses the stack's built-in test keys; nothing touches staging.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { TEST_PASSWORD, TEST_USERS } from '../e2e/users.ts'
import { cleanRegistration, emptyRegistration, registrationSchema } from '../lib/members/registration.ts'

const ENV_FILE = '.env.development.local'
// CI starts only what the tests use; locally you also get Studio (database UI) and Mailpit (emails)
const CI_EXCLUDE = 'studio,postgres-meta,imgproxy,mailpit,supavisor,logflare,vector,edge-runtime,realtime'

const fail = (msg) => { console.error(`\n✖ ${msg}`); process.exit(1) }

function run(cmd, args, { capture = false } = {}) {
  const r = spawnSync(cmd, args, { stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit', encoding: 'utf8' })
  if (r.error) fail(`${cmd} could not run: ${r.error.message}`)
  if (r.status !== 0) {
    if (capture) process.stderr.write(r.stderr || r.stdout || '')
    fail(`${cmd} ${args.join(' ')} failed (exit ${r.status})`)
  }
  return r.stdout ?? ''
}
const cli = (...args) => run('npx', ['supabase', ...args])

function stack() {
  const out = run('npx', ['supabase', 'status', '-o', 'json'], { capture: true })
  const s = JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1)) // skip CLI notices
  if (!s.API_URL || !s.ANON_KEY || !s.SERVICE_ROLE_KEY || !s.DB_URL) fail('supabase status returned incomplete details')
  return { ...s, DB_URL: `${s.DB_URL}${s.DB_URL.includes('?') ? '&' : '?'}sslmode=disable` }
}

function migrate(dbUrl) {
  console.log('\n▸ applying migrations (dbmate, db/migrations)')
  run('node', ['node_modules/dbmate/dist/cli.js', '--url', dbUrl, '--no-dump-schema', '--migrations-table', 'dbmate.schema_migrations', 'up'])
}

// ---- seed: one login per role, plus a little sample data on a fresh database
async function seed(s) {
  console.log('\n▸ test logins and sample data')
  const db = createClient(s.API_URL, s.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  const check = (what, { error }) => { if (error) fail(`${what}: ${error.message}`) }

  const ids = {}
  for (const [role, u] of Object.entries(TEST_USERS)) {
    const created = await db.auth.admin.createUser({
      email: u.email, password: TEST_PASSWORD, email_confirm: true,
      user_metadata: { first_name: u.firstName, last_name: u.lastName },
    })
    if (created.error && !/already (been )?registered|already exists/i.test(created.error.message)) fail(`login ${u.email}: ${created.error.message}`)
    const { data, error } = await db.from('profiles')
      .update({ role, first_name: u.firstName, last_name: u.lastName, is_active: true })
      .eq('email', u.email).select('id').single()
    if (error) fail(`profile ${u.email}: ${error.message}`)
    ids[role] = data.id
  }

  const { count } = await db.from('ministries').select('id', { count: 'exact', head: true })
  if (count) { console.log('  sample data already present, left as it is'); return }

  const day = (offset, hour = 10) => { const d = new Date(); d.setDate(d.getDate() + offset); d.setHours(hour, 0, 0, 0); return d.toISOString() }
  const date = (offset) => day(offset).slice(0, 10)

  const ministries = await db.from('ministries').insert([
    { name: 'መዘምራን · Choir', description: 'Sunday and festival worship', leader_id: ids.ministry_leader, meeting_day: 'Saturday', meeting_time: '15:00', location: 'Main hall' },
    { name: 'ወጣቶች · Youth', description: 'Bible study and fellowship for 15–30', meeting_day: 'Friday', meeting_time: '17:30', location: 'Youth room' },
    { name: 'ጸሎት · Prayer', description: 'Weekly prayer meeting', meeting_day: 'Wednesday', meeting_time: '18:00', location: 'Chapel' },
    { name: 'የሕፃናት ክፍል · Children', description: 'Sunday school', meeting_day: 'Sunday', meeting_time: '09:00', location: 'Room 2' },
  ]).select('id, name')
  check('ministries', ministries)
  const ministry = Object.fromEntries(ministries.data.map((m) => [m.name.split(' · ')[1], m.id]))

  check('events', await db.from('events').insert([
    { title: 'Sunday service', event_type: 'Service', start_date: day(7 - new Date().getDay(), 9), end_date: day(7 - new Date().getDay(), 12), location: 'Main hall', organizer_id: ids.admin },
    { title: 'Choir rehearsal', event_type: 'Rehearsal', start_date: day(2, 15), location: 'Main hall', organizer_id: ids.ministry_leader, ministry_id: ministry.Choir },
    { title: 'Youth conference', event_type: 'Conference', start_date: day(21, 9), end_date: day(22, 17), location: 'Main hall', organizer_id: ids.admin, ministry_id: ministry.Youth, max_attendees: 150 },
  ]))

  check('financial transactions', await db.from('financial_transactions').insert([
    { transaction_type: 'income', category: 'Tithe', amount: 12500, currency: 'ETB', description: 'Sunday tithes', transaction_date: date(-7), recorded_by_id: ids.finance },
    { transaction_type: 'income', category: 'Offering', amount: 4300.5, currency: 'ETB', description: 'Sunday offering', transaction_date: date(-7), recorded_by_id: ids.finance },
    { transaction_type: 'income', category: 'Building fund', amount: 20000, currency: 'ETB', description: 'Building fund pledge', member_id: ids.member, transaction_date: date(-3), recorded_by_id: ids.finance },
    { transaction_type: 'expense', category: 'Utilities', amount: 1850, currency: 'ETB', description: 'Electricity bill', transaction_date: date(-2), recorded_by_id: ids.finance },
  ]))

  check('announcements', await db.from('announcements').insert([
    { title: 'Welcome to the local test church', content: 'Everything here is test data on your own machine.', author_id: ids.admin, author_name: 'Abeba Admin' },
  ]))

  const people = [
    { firstNameAm: 'አበበ', fatherNameAm: 'ከበደ', gfNameAm: 'ተሰማ', sex: 'male', phone: '0911000001', marital: 'married', spouse: 'ሰላም ታደሰ', children: '2', childrenList: [{ name: 'ሔዋን አበበ', sex: 'female', edu: 'primary', age: '9' }, { name: 'ዳዊት አበበ', sex: 'male', edu: 'secondary', age: '15' }], depts: ['choir'], baptized: 'yes', baptismDate: '2015-06-14', role: 'member' },
    { firstNameAm: 'ሰላም', fatherNameAm: 'ታደሰ', sex: 'female', phone: '0911000002', marital: 'married', spouse: 'አበበ ከበደ', depts: ['prayer', 'women'], role: 'deacon' },
    { firstNameAm: 'ዮናስ', fatherNameAm: 'ገብሬ', sex: 'male', phone: '0911000003', marital: 'single', depts: ['none'], wantsDept: 'youth' },
  ]
  for (const p of people) {
    // the form's own rules, so sample members always look like real registrations
    const payload = registrationSchema.parse(cleanRegistration({ ...emptyRegistration(), ...p }))
    check(`member ${p.firstNameAm}`, await db.rpc('register_member', { payload }))
  }
  console.log(`  ${Object.keys(ids).length} logins, ${ministries.data.length} ministries, 3 events, 4 transactions, ${people.length} registered members`)
}

function writeEnv(s) {
  const values = {
    NEXT_PUBLIC_SUPABASE_URL: s.API_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: s.ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: s.SERVICE_ROLE_KEY,
    DATABASE_URL: s.DB_URL,
  }
  const lines = Object.entries(values).map(([k, v]) => `${k}=${v}`).join('\n')
  fs.writeFileSync(ENV_FILE, `# Written by \`npm run local:start\`, removed by \`npm run local:stop\`.\n# The local stack's built-in test keys; npm run dev uses these ahead of .env.local.\n${lines}\n`)
  // CI: hand the same values to the following workflow steps (build, Playwright)
  if (process.env.GITHUB_ENV) fs.appendFileSync(process.env.GITHUB_ENV, `${lines}\n`)
}

function summary(s) {
  console.log(`
✔ Local stack ready
  App            npm run dev → http://localhost:3000
  Studio         ${s.STUDIO_URL ?? '(not started)'}   database tables, auth users, storage
  Emails         ${s.MAILPIT_URL ?? s.INBUCKET_URL ?? '(not started)'}   invitations and password resets land here
  API            ${s.API_URL}
  Database       ${s.DB_URL}

  Logins (password: ${TEST_PASSWORD})
${Object.entries(TEST_USERS).map(([role, u]) => `    ${role.padEnd(16)} ${u.email}`).join('\n')}

  Stop with npm run local:stop · rebuild from scratch with npm run local:reset`)
}

const command = process.argv[2]
if (command === 'start' || command === 'reset') {
  if (command === 'start') cli('start', ...(process.env.CI ? ['-x', CI_EXCLUDE] : []))
  else cli('db', 'reset')
  const s = stack()
  migrate(s.DB_URL)
  await seed(s)
  writeEnv(s)
  summary(s)
} else if (command === 'stop') {
  cli('stop')
  fs.rmSync(ENV_FILE, { force: true })
  console.log(`✔ stopped; removed ${ENV_FILE}, so npm run dev uses .env.local again`)
} else if (command === 'status') {
  summary(stack())
} else {
  fail('usage: node scripts/local.mjs start | reset | stop | status')
}
