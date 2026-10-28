#!/usr/bin/env node
// Compares the Auth and Storage settings in supabase/config.toml with a Supabase project, and applies
// them. It uses only two Management API endpoints, so the token needs nothing beyond
// "Auth Config: read-write" and "Storage: read-write" on that one project. (The Supabase CLI's
// `config diff/push` reads every settings area through a single endpoint that such narrowly scoped
// tokens can't be granted.) Used by the Deploy workflow; docs/ENGINEERING.md → Supabase settings.
//
//   node scripts/supabase-settings.mjs diff    list differences; exit 2 when there are any
//   node scripts/supabase-settings.mjs apply   change only the settings that differ, then re-check
//
// Needs SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF. SUPABASE_API_URL points at another API (tests).
// Mappings follow the Supabase CLI's own config-to-API table, so local and remote mean the same thing.
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import { parse } from 'smol-toml'

// config.toml password_requirements → API password_required_characters
export const PASSWORD_RULES = {
  '': '',
  letters_digits: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ:0123456789',
  lower_upper_letters_digits: 'abcdefghijklmnopqrstuvwxyz:ABCDEFGHIJKLMNOPQRSTUVWXYZ:0123456789',
}

// Every [auth] / [auth.email] / [storage] key this script manages. A key in config.toml that isn't
// listed here (and isn't local-only) is an error, so a new setting can't be silently ignored.
const AUTH = {
  enable_signup: { api: 'disable_signup', to: (v) => !v },
  site_url: { api: 'site_url', to: (v) => v },
  additional_redirect_urls: { api: 'uri_allow_list', to: (v) => v.join(','), same: sameCsv },
  minimum_password_length: { api: 'password_min_length', to: (v) => v },
  password_requirements: { api: 'password_required_characters', to: passwordRule, show: passwordName },
  enable_anonymous_sign_ins: { api: 'external_anonymous_users_enabled', to: (v) => v },
}
const AUTH_EMAIL = {
  enable_signup: { api: 'external_email_enabled', to: (v) => v },
}
const STORAGE = {
  file_size_limit: { api: 'fileSizeLimit', to: bytes, show: showBytes },
}

function passwordName(chars) {
  const name = Object.entries(PASSWORD_RULES).find(([, c]) => c === chars)?.[0]
  return name === undefined ? JSON.stringify(chars) : name === '' ? '(none)' : name
}
function passwordRule(v) {
  if (!(v in PASSWORD_RULES)) throw new Error(`auth.password_requirements "${v}" is not one of: ${Object.keys(PASSWORD_RULES).join(', ')}`)
  return PASSWORD_RULES[v]
}

const UNITS = { B: 1, KB: 1e3, KIB: 1024, MB: 1e6, MIB: 1024 ** 2, GB: 1e9, GIB: 1024 ** 3 }
export function bytes(v) {
  if (typeof v === 'number') return v
  const m = /^\s*(\d+(?:\.\d+)?)\s*([a-z]+)\s*$/i.exec(String(v))
  if (!m || !(m[2].toUpperCase() in UNITS)) throw new Error(`storage.file_size_limit "${v}" is not a size like "10MiB"`)
  return Math.round(Number(m[1]) * UNITS[m[2].toUpperCase()])
}
function showBytes(n) {
  if (typeof n !== 'number') return JSON.stringify(n)
  const mib = n / 1024 ** 2
  return Number.isInteger(mib) ? `${mib} MiB` : `${n} bytes`
}
function sameCsv(a, b) {
  const set = (s) => [...new Set(String(s ?? '').split(',').map((x) => x.trim()).filter(Boolean))].sort().join(',')
  return set(a) === set(b)
}

/** The settings config.toml asks for on one project: base values with its [remotes.*] block on top. */
export function wantedSettings(config, ref) {
  const remote = Object.values(config.remotes ?? {}).find((r) => r.project_id === ref)
  if (!remote) throw new Error(`supabase/config.toml has no [remotes.*] block with project_id = "${ref}"`)
  const { email: baseEmail = {}, ...baseAuth } = config.auth ?? {}
  const { email: remoteEmail = {}, ...remoteAuth } = remote.auth ?? {}
  const sections = [
    ['auth', { ...baseAuth, ...remoteAuth }, AUTH],
    ['auth.email', { ...baseEmail, ...remoteEmail }, AUTH_EMAIL],
    ['storage', { ...config.storage, ...remote.storage }, STORAGE],
  ]
  const wanted = { auth: [], storage: [] }
  for (const [name, values, map] of sections) {
    for (const [key, value] of Object.entries(values)) {
      const m = map[key]
      if (!m) throw new Error(`${name}.${key} is in supabase/config.toml but scripts/supabase-settings.mjs doesn't manage it yet: add it to the mapping (see the Supabase CLI's config reference) or remove it`)
      wanted[name === 'storage' ? 'storage' : 'auth'].push({ setting: `${name}.${key}`, api: m.api, value: m.to(value), same: m.same, show: m.show })
    }
  }
  return wanted
}

/** Differences between what config.toml wants and what the project has now. */
export function differences(wanted, current) {
  const out = []
  for (const area of ['auth', 'storage']) {
    for (const w of wanted[area]) {
      const now = current[area]?.[w.api]
      const equal = w.same ? w.same(now, w.value) : JSON.stringify(now ?? null) === JSON.stringify(w.value)
      if (!equal) out.push({ area, ...w, now })
    }
  }
  return out
}

function api() {
  const base = (process.env.SUPABASE_API_URL || 'https://api.supabase.com').replace(/\/$/, '')
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim()
  const ref = process.env.SUPABASE_PROJECT_REF?.trim()
  if (!token || !ref) throw new Error('SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF are required')
  const call = async (method, path, body) => {
    const res = await fetch(`${base}/v1/projects/${ref}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (res.status === 401) throw new Error('Supabase rejected the access token (expired or revoked): create a new one (docs/SETUP.md §7)')
    if (res.status === 403) throw new Error(`The access token may not ${method === 'GET' ? 'read' : 'change'} ${path}: it needs "Auth Config: read-write" and "Storage: read-write" on project ${ref}`)
    if (!res.ok) throw new Error(`${method} ${path}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`)
    return res.status === 204 ? {} : res.json()
  }
  return { ref, call }
}

const read = async (call) => ({ auth: await call('GET', '/config/auth'), storage: await call('GET', '/config/storage') })

function report(diffs) {
  if (!diffs.length) return 'Same as supabase/config.toml.'
  const show = (d, v) => (d.show ? d.show(v) : JSON.stringify(v ?? null))
  return ['Differences (now → supabase/config.toml):', ...diffs.map((d) => `  ${d.setting.padEnd(32)} ${show(d, d.now)} → ${show(d, d.value)}`)].join('\n')
}

export async function main(command, configPath = 'supabase/config.toml') {
  const { ref, call } = api()
  const wanted = wantedSettings(parse(fs.readFileSync(configPath, 'utf8')), ref)
  const diffs = differences(wanted, await read(call))
  console.log(report(diffs))
  if (command === 'diff') return diffs.length ? 2 : 0
  if (command !== 'apply') throw new Error('usage: node scripts/supabase-settings.mjs diff | apply')
  if (!diffs.length) return 0
  const patch = (area) => Object.fromEntries(diffs.filter((d) => d.area === area).map((d) => [d.api, d.value]))
  if (diffs.some((d) => d.area === 'auth')) await call('PATCH', '/config/auth', patch('auth'))
  if (diffs.some((d) => d.area === 'storage')) await call('PATCH', '/config/storage', patch('storage'))
  const left = differences(wanted, await read(call))
  if (left.length) throw new Error(`still different after applying:\n${report(left)}`)
  console.log(`Applied ${diffs.length} setting(s); the project now matches supabase/config.toml.`)
  return 0
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main(process.argv[2]).then((code) => process.exit(code), (e) => { console.error(`✖ ${e.message}`); process.exit(1) })
}
