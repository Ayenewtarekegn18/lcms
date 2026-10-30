#!/usr/bin/env node
// Import members from the lebu-form register (Google Sheet + Apps Script) into Supabase, keeping each
// member's existing number (LKH-0001…) so printed ID cards stay valid. Validation is the app's own
// (lib/members/registration.ts), so imported rows obey the same rules as the registration form.
//
//   npm run import:lebu-form -- --file members.json [--dry-run]
//   npm run import:lebu-form -- --endpoint [--photos] [--dry-run]
//
//   --file      JSON saved from the Apps Script "list" action ({ members: [...] }) or a plain array
//   --endpoint  fetch the list from LEBU_FORM_ENDPOINT using LEBU_FORM_PASSCODE (the office passcode)
//   --photos    also copy photos from Google Drive (needs --endpoint)
//   --dry-run   validate and report, write nothing
// Needs NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and ALLOW_MEMBER_IMPORT=true.
// Safe to re-run: members whose number already exists are skipped.
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { registrationSchema, cleanRegistration, emptyRegistration, FIELDS } from '../lib/members/registration.ts'

const args = process.argv.slice(2)
const flag = (name) => args.includes(`--${name}`)
const option = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined }
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
let members
if (option('file')) {
  const raw = JSON.parse(fs.readFileSync(option('file'), 'utf8'))
  members = Array.isArray(raw) ? raw : raw.members
} else if (flag('endpoint')) {
  members = (await appsScript('list')).members
} else {
  fail('give --file <members.json> or --endpoint')
}
if (!Array.isArray(members)) fail('no members array found in the input')
console.log(`${members.length} member(s) in the source${dryRun ? ' (dry run: nothing will be written)' : ''}`)

// ---- normalise one lebu-form record into the registration shape
const KEYS = Object.keys(emptyRegistration())
const str = (v) => (v === null || v === undefined ? '' : String(v).trim())
function toInput(m) {
  const input = emptyRegistration()
  for (const k of KEYS) {
    if (k === 'childrenList') input[k] = (Array.isArray(m[k]) ? m[k] : []).map((r) => ({ name: str(r.name), sex: str(r.sex), edu: str(r.edu), age: str(r.age) }))
    else if (k === 'household') input[k] = (Array.isArray(m[k]) ? m[k] : []).map((r) => ({ name: str(r.name), rel: str(r.rel), age: str(r.age) }))
    else if (k === 'depts') input[k] = Array.isArray(m[k]) ? m[k].map(str).filter(Boolean) : str(m[k]).split(';').map(str).filter(Boolean)
    else if (k in m) input[k] = str(m[k])
  }
  return cleanRegistration(input)
}

// Sheet cells can hold free text the form would never produce. Required fields must be valid;
// an invalid optional field is dropped (and reported) rather than losing the whole member.
const required = new Set(FIELDS.filter((f) => f.req).map((f) => f.k))
function validate(m) {
  const input = toInput(m)
  let result = registrationSchema.safeParse(input)
  const dropped = []
  if (!result.success) {
    const bad = Object.keys(z.flattenError(result.error).fieldErrors)
    const fatal = bad.filter((k) => required.has(k))
    if (fatal.length) return { error: `invalid ${fatal.join(', ')}` }
    for (const k of bad) { input[k] = Array.isArray(input[k]) ? [] : ''; dropped.push(k) }
    result = registrationSchema.safeParse(cleanRegistration(input))
    if (!result.success) return { error: `invalid ${Object.keys(z.flattenError(result.error).fieldErrors).join(', ')}` }
  }
  return { data: result.data, dropped }
}

// ---- import
const supabase = dryRun ? null : createClient(url, serviceKey, { auth: { persistSession: false } })
const report = { imported: [], skipped: [], failed: [], dropped: [] }
const created = new Map() // memberNumber -> profile id

for (const m of members) {
  const number = str(m.memberId)
  const label = `${number || '(no number)'} ${str(m.firstNameAm)} ${str(m.fatherNameAm)}`.trim()
  if (!number) { report.failed.push(`${label}: missing memberId`); continue }
  const v = validate(m)
  if (v.error) { report.failed.push(`${label}: ${v.error}`); continue }
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
  const ids = members.filter((m) => m.photoDrive && created.has(str(m.memberId))).map((m) => str(m.memberId))
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
