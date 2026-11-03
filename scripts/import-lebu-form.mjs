#!/usr/bin/env node
// Import members from the lebu-form register (Google Sheet + Apps Script) into Supabase, keeping each
// member's existing number (LKH-0001…) so printed ID cards stay valid. Validation is the app's own
// (lib/members/registration.ts), so imported rows obey the same rules as the registration form.
//
// The app's Members → Import page does the same for admins without a terminal; this script is for
// large imports and for copying photos from Google Drive.
//
//   npm run import:lebu-form -- --file members.json [--file more.json] [--dry-run]
//   npm run import:lebu-form -- --dir exported-members/ [--dry-run]
//   npm run import:lebu-form -- --endpoint [--photos] [--dry-run]
//
//   --file      a lebu-form backup ({ members: [...] }), a plain array or one member; may repeat
//   --dir       every .json file in a folder (for example one file per member)
//   --endpoint  fetch the list from LEBU_FORM_ENDPOINT using LEBU_FORM_PASSCODE (the office passcode)
//   --photos    also copy photos from Google Drive (needs --endpoint)
//   --dry-run   validate and report, write nothing
// Needs NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and ALLOW_MEMBER_IMPORT=true.
// Safe to re-run: members whose number already exists are skipped.
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import path from 'node:path'
import { membersFromJson, prepareImport } from '../lib/members/registration.ts'

const args = process.argv.slice(2)
const flag = (name) => args.includes(`--${name}`)
const options = (name) => args.flatMap((a, i) => (a === `--${name}` && args[i + 1] ? [args[i + 1]] : []))
const dryRun = flag('dry-run')

const fail = (msg) => { console.error(`✖ ${msg}`); process.exit(1) }
const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: serviceKey } = process.env
if (!dryRun) {
  if (!url || !serviceKey) fail('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  if (process.env.ALLOW_MEMBER_IMPORT !== 'true') fail('set ALLOW_MEMBER_IMPORT=true to confirm the target project')
}

async function appsScript(action, extra = {}) {
  const endpoint = process.env.LEBU_FORM_ENDPOINT
  const key = process.env.LEBU_FORM_PASSCODE
  if (!endpoint || !key) fail('--endpoint needs LEBU_FORM_ENDPOINT and LEBU_FORM_PASSCODE')
  // plain-text body, no custom headers: the Apps Script web app expects a "simple" request
  const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ action, key, ...extra }) })
  const body = await res.json()
  if (body.error) fail(`Apps Script: ${body.error}`)
  return body
}

// ---- load
const files = [
  ...options('file'),
  ...options('dir').flatMap((d) => fs.readdirSync(d).filter((f) => f.toLowerCase().endsWith('.json')).sort().map((f) => path.join(d, f))),
]
let members
if (files.length) {
  members = files.flatMap((f) => {
    try { return membersFromJson(JSON.parse(fs.readFileSync(f, 'utf8'))) } catch (e) { fail(`${f}: ${e.message}`) }
  })
} else if (flag('endpoint')) {
  members = (await appsScript('list')).members
} else {
  fail('give --file <members.json>, --dir <folder> or --endpoint')
}
if (!Array.isArray(members)) fail('no members array found in the input')
console.log(`${members.length} member(s) in the source${dryRun ? ' (dry run: nothing will be written)' : ''}`)

// ---- import
const supabase = dryRun ? null : createClient(url, serviceKey, { auth: { persistSession: false } })
const report = { imported: [], skipped: [], failed: [], dropped: [] }
const created = new Map() // memberNumber -> profile id

for (const m of members) {
  const v = prepareImport(m)
  const { number, label } = v
  if (!v.ok) { report.failed.push(`${label}: ${v.error}`); continue }
  if (v.dropped.length) report.dropped.push(`${label}: ${v.dropped.join(', ')}`)
  if (dryRun) { report.imported.push(label); continue }

  const { data: existing } = await supabase.from('member_details').select('member_id').eq('member_number', number).maybeSingle()
  if (existing) { report.skipped.push(`${label}: already imported`); created.set(number, existing.member_id); continue }

  const { data, error } = await supabase.rpc('register_member', { payload: { ...v.data, memberNumber: number } })
  if (error) { report.failed.push(`${label}: ${error.message}`); continue }
  created.set(number, data.id)
  report.imported.push(label)
}

if (!dryRun && report.imported.length) {
  const { error } = await supabase.rpc('sync_member_number_seq')
  if (error) console.error(`✖ could not move the member-number sequence past the imported numbers: ${error.message}`)
}

// ---- photos (Drive → private member-photos bucket)
if (flag('photos') && !dryRun) {
  if (!flag('endpoint')) fail('--photos needs --endpoint')
  const ids = members.filter((m) => m.photoDrive && created.has(String(m.memberId).trim().toUpperCase())).map((m) => String(m.memberId).trim().toUpperCase())
  let copied = 0
  for (let i = 0; i < ids.length; i += 10) {
    const { photos } = await appsScript('photos', { ids: ids.slice(i, i + 10) })
    for (const [number, dataUrl] of Object.entries(photos ?? {})) {
      const match = /^data:(image\/[a-z+]+);base64,(.*)$/.exec(String(dataUrl ?? ''))
      if (!match) continue
      const id = created.get(number)
      const path = `${id}.jpg`
      const { error } = await supabase.storage.from('member-photos').upload(path, Buffer.from(match[2], 'base64'), { contentType: match[1], upsert: true })
      if (error) { report.failed.push(`${number}: photo upload failed (${error.message})`); continue }
      await supabase.from('member_details').update({ photo_path: path }).eq('member_id', id)
      copied++
    }
  }
  console.log(`photos copied: ${copied}/${ids.length}`)
}

// ---- report
const section = (title, rows) => { if (rows.length) console.log(`\n${title} (${rows.length})\n  ${rows.join('\n  ')}`) }
section(dryRun ? 'Would import' : 'Imported', report.imported)
section('Skipped', report.skipped)
section('Optional fields dropped because they were not valid form values', report.dropped)
section('Failed', report.failed)
process.exit(report.failed.length ? 2 : 0)
