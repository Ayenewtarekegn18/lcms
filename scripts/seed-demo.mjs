#!/usr/bin/env node
// Demo data for a ministry try-out on STAGING (never production): one leader login per ministry,
// a few demo members in the register, members and upcoming events for every ministry, and a couple
// of sample rows in each ministry's own tables. Safe to re-run: existing logins, members and rows
// are reused, and a ministry that already has demo data is left alone.
//
//   GitHub: Actions → "Seed demo data" → Run workflow   (.github/workflows/seed-demo.yml)
//   local:  DEMO_PASSWORD=… node --env-file=.env.development.local scripts/seed-demo.mjs
//
// Needs NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY and DEMO_PASSWORD
// (the password every demo login gets; 12+ characters with upper and lower case and a digit).
// Logins are <slug>@demo.lkhc.test. Confidential ministries (deacons, charity, workers' aid) get
// an elder login, because only admins and elders may see that data.
import { createClient } from '@supabase/supabase-js'

const fail = (msg) => { console.error(`✖ ${msg}`); process.exit(1) }
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const password = process.env.DEMO_PASSWORD
if (!url || !key) fail('NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are required')
if (!password || password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
  fail('DEMO_PASSWORD must have 12+ characters with upper and lower case letters and a digit')
}
if (process.env.DEMO_TARGET === 'production') fail('demo data never goes to production')

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const warn = (what, error) => console.log(`  ! ${what}: ${error.message}`)

const PASTORAL = new Set(['deacons', 'charity', 'workers-aid'])
const day = (offset, hour = 10) => { const d = new Date(); d.setDate(d.getDate() + offset); d.setHours(hour, 0, 0, 0); return d.toISOString() }
const date = (offset) => day(offset).slice(0, 10)

async function login(email, firstName, lastName, role) {
  const created = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name: firstName, last_name: lastName } })
  if (created.error && !/already (been )?registered|already exists/i.test(created.error.message)) fail(`login ${email}: ${created.error.message}`)
  const { data, error } = await db.from('profiles')
    .update({ role, first_name: firstName, last_name: lastName, is_active: true })
    .eq('email', email).select('id').single()
  if (error) fail(`profile ${email}: ${error.message}`)
  return data.id
}

// ---- demo members (register entries without logins)
const PEOPLE = [
  ['ዮሐንስ', 'ታደሰ', 'male', '0911100001'], ['ማርታ', 'በቀለ', 'female', '0911100002'], ['ሳሙኤል', 'ገብሬ', 'male', '0911100003'],
  ['ሩት', 'አለሙ', 'female', '0911100004'], ['ዳንኤል', 'ኃይሉ', 'male', '0911100005'], ['ሊድያ', 'ወልዴ', 'female', '0911100006'],
  ['ኤፍሬም', 'ሙሉጌታ', 'male', '0911100007'], ['ቤተልሔም', 'አሰፋ', 'female', '0911100008'],
]
async function demoMembers() {
  const ids = []
  for (const [first, father, sex, phone] of PEOPLE) {
    const { data: found } = await db.from('profiles').select('id').eq('phone', phone).maybeSingle()
    if (found) { ids.push(found.id); continue }
    const payload = { firstNameAm: first, fatherNameAm: father, sex, phone, status: 'active', depts: [], childrenList: [], household: [] }
    const { data, error } = await db.rpc('register_member', { payload })
    if (error) { warn(`member ${first}`, error); continue }
    ids.push(data.id)
  }
  return ids
}

// ---- a couple of rows in each ministry's own tables (columns from lib/database.types.ts)
const SAMPLES = {
  administration: (m) => [['admin_tasks', [
    { title: 'Prepare the annual report', due_date: date(14), status: 'pending', assigned_to_id: m[0] },
    { title: 'Renew the hall insurance', due_date: date(30), status: 'pending' },
  ]]],
  charity: (m) => [['charity_aid_requests', [
    { member_id: m[1], request_date: date(-3), amount_requested: 2500, reason: 'School fees', status: 'pending' },
  ]]],
  children: () => [['children_classes', [
    { name: 'Beginners (4–6)', age_group: '4-6', schedule_text: 'Sunday 09:00', location: 'Room 2' },
    { name: 'Juniors (7–10)', age_group: '7-10', schedule_text: 'Sunday 09:00', location: 'Room 3' },
  ]]],
  choir: () => [['choir_songs', [{ title: 'ሃሌ ሉያ', composer: 'Traditional' }, { title: 'እግዚአብሔር መልካም ነው', composer: 'Choir arrangement' }]]],
  deacons: (m, leader) => [['deacon_care_visits', [{ member_id: m[2], visitor_id: leader, visit_date: date(-2), notes: 'Home visit after surgery; doing well.' }]]],
  'marriage-family': () => [['marriage_seminars', [{ title: 'Pre-marriage seminar', seminar_date: date(20), location: 'Hall B' }]]],
  mission: () => [['mission_trips', [{ title: 'Outreach to Debre Birhan', trip_date: date(40), location: 'Debre Birhan', status: 'planned' }]]],
  'prayer-groups': () => [['prayer_groups', [{ name: 'Morning prayer', meeting_schedule: 'Daily 06:00' }, { name: "Women's prayer", meeting_schedule: 'Thursday 17:00' }]]],
  'stage-worship': () => [['worship_equipment', [{ name: 'Main mixer', status: 'available' }, { name: 'Wireless microphones (4)', status: 'available' }]]],
  teaching: () => [['education_programs', [{ title: 'Foundations of faith', start_date: date(7), duration_weeks: 8, location: 'Room 1', is_active: true }]]],
  'workers-aid': (m) => [['workers_aid_beneficiaries', [{ member_id: m[3], monthly_amount: 1500, start_date: date(-60), status: 'active' }]]],
  youth: (m) => [['youth_programs', [{ name: 'Youth Bible study', program_date: date(5), location: 'Youth room', leader_id: m[4], is_active: true }]]],
  women: () => [['women_meetings', [{ title: 'Monthly fellowship', meeting_date: date(10), location: 'Hall A' }]]],
  'spiritual-service': () => [['spiritual_classes', [{ title: 'Baptism preparation', class_date: date(12), location: 'Room 1' }]]],
}

const { data: ministries, error } = await db.from('ministries').select('id, slug, name').not('slug', 'is', null).order('slug')
if (error) fail(`ministries: ${error.message}`)
if (!ministries.length) fail('no ministries with a slug: apply the migrations first (20261101000001_ministry_slugs)')

const people = await demoMembers()
console.log(`demo members in the register: ${people.length}`)

const accounts = []
for (const [i, m] of ministries.entries()) {
  const role = PASTORAL.has(m.slug) ? 'elder' : 'ministry_leader'
  const email = `${m.slug}@demo.lkhc.test`
  const leaderId = await login(email, m.name.split(' ')[0], 'Demo', role)
  accounts.push({ ministry: m.name, email, role })

  const { count } = await db.from('events').select('id', { count: 'exact', head: true }).eq('ministry_id', m.id)
  if (count) { console.log(`  ${m.slug}: already has demo data, left as it is`); continue }

  const members = [leaderId, ...people.slice(i % 4, (i % 4) + 4)]
  const roster = members.map((id, k) => ({ ministry_id: m.id, member_id: id, role: k === 0 ? 'leader' : 'member', is_active: true }))
  const r = await db.from('ministry_members').upsert(roster, { onConflict: 'ministry_id,member_id' })
  if (r.error) warn(`${m.slug} members`, r.error)

  const e = await db.from('events').insert([
    { title: `${m.name}: weekly meeting`, event_type: 'Meeting', start_date: day(3 + (i % 5), 17), location: 'Church hall', organizer_id: leaderId, ministry_id: m.id },
    { title: `${m.name}: planning day`, event_type: 'Meeting', start_date: day(17 + (i % 7), 10), location: 'Room 1', organizer_id: leaderId, ministry_id: m.id },
  ])
  if (e.error) warn(`${m.slug} events`, e.error)

  for (const [table, rows] of (SAMPLES[m.slug]?.(people, leaderId) ?? [])) {
    const s = await db.from(table).insert(rows)
    if (s.error) warn(`${m.slug} ${table}`, s.error)
  }
  console.log(`  ${m.slug}: leader, ${members.length} members, 2 events, sample rows`)
}

console.log('\nDemo logins (all with the DEMO_PASSWORD you set):')
for (const a of accounts) console.log(`  ${a.ministry.padEnd(36)} ${a.email.padEnd(38)} ${a.role}`)
