import fs from 'node:fs'
import http from 'node:http'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { parse } from 'smol-toml'
import { PASSWORD_RULES, bytes, differences, main, wantedSettings } from '../../scripts/supabase-settings.mjs'

const config = parse(fs.readFileSync('supabase/config.toml', 'utf8'))
const STAGING = config.remotes.staging.project_id
const byApi = (list) => Object.fromEntries(list.map((w) => [w.api, w.value]))

describe('wantedSettings (supabase/config.toml → API fields)', () => {
  it('maps every staging setting the way the Supabase CLI does', () => {
    const w = wantedSettings(config, STAGING)
    expect(byApi(w.auth)).toEqual({
      disable_signup: true,
      site_url: 'https://lcms-kappa.vercel.app',
      uri_allow_list: 'https://lcms-kappa.vercel.app/**,http://localhost:3000/**',
      password_min_length: 12,
      password_required_characters: PASSWORD_RULES.lower_upper_letters_digits,
      external_anonymous_users_enabled: false,
      external_email_enabled: true,
    })
    expect(byApi(w.storage)).toEqual({ fileSizeLimit: 10 * 1024 * 1024 })
  })

  it('refuses a project with no [remotes.*] block', () => {
    expect(() => wantedSettings(config, 'aaaaaaaaaaaaaaaaaaaa')).toThrow(/no \[remotes\.\*\] block/)
  })

  it('refuses settings it does not manage, so nothing is silently ignored', () => {
    const extra = { ...config, auth: { ...config.auth, jwt_expiry: 600 } }
    expect(() => wantedSettings(extra, STAGING)).toThrow(/auth\.jwt_expiry .* doesn't manage it/)
    const table = { ...config, auth: { ...config.auth, rate_limit: { email_sent: 2 } } }
    expect(() => wantedSettings(table, STAGING)).toThrow(/auth\.rate_limit/)
  })

  it('refuses an unknown password rule', () => {
    const bad = { ...config, auth: { ...config.auth, password_requirements: 'strong' } }
    expect(() => wantedSettings(bad, STAGING)).toThrow(/password_requirements "strong"/)
  })
})

describe('bytes', () => {
  it('reads sizes the way config.toml writes them', () => {
    expect(bytes('10MiB')).toBe(10485760)
    expect(bytes('50MB')).toBe(50e6)
    expect(bytes('512KiB')).toBe(524288)
    expect(bytes(1234)).toBe(1234)
    expect(() => bytes('ten megs')).toThrow(/not a size/)
  })
})

describe('differences', () => {
  it('ignores the order of redirect URLs', () => {
    const w = wantedSettings(config, STAGING)
    const current = { auth: { ...byApi(w.auth), uri_allow_list: 'http://localhost:3000/**, https://lcms-kappa.vercel.app/**' }, storage: byApi(w.storage) }
    expect(differences(w, current)).toEqual([])
  })
})

// ---- against a fake Management API
let server
let state
const calls = []
beforeAll(async () => {
  server = http.createServer((req, res) => {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      calls.push(`${req.method} ${req.url}${body ? ` ${body}` : ''}`)
      if (req.headers.authorization !== 'Bearer sbp_test') { res.writeHead(401); return res.end() }
      const area = req.url.endsWith('/config/auth') ? 'auth' : req.url.endsWith('/config/storage') ? 'storage' : null
      if (!area || !req.url.startsWith(`/v1/projects/${STAGING}/`)) { res.writeHead(404); return res.end() }
      if (req.method === 'PATCH') Object.assign(state[area], JSON.parse(body))
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify(state[area]))
    })
  })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  process.env.SUPABASE_API_URL = `http://127.0.0.1:${server.address().port}`
  process.env.SUPABASE_PROJECT_REF = STAGING
})
afterAll(() => server.close())
beforeEach(() => {
  calls.length = 0
  process.env.SUPABASE_ACCESS_TOKEN = 'sbp_test'
  // what the staging project looks like before the first apply (Supabase defaults)
  state = {
    auth: { disable_signup: false, site_url: 'http://localhost:3000', uri_allow_list: '', password_min_length: 6, password_required_characters: '', external_anonymous_users_enabled: false, external_email_enabled: true, jwt_exp: 3600 },
    storage: { fileSizeLimit: 52428800, features: { imageTransformation: { enabled: true } } },
  }
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

describe('main', () => {
  it('diff lists the differences and exits 2 without changing anything', async () => {
    expect(await main('diff')).toBe(2)
    expect(calls.every((c) => c.startsWith('GET '))).toBe(true)
    const printed = console.log.mock.calls.flat().join('\n')
    expect(printed).toMatch(/auth\.enable_signup\s+false → true/)
    expect(printed).toMatch(/auth\.password_requirements\s+\(none\) → lower_upper_letters_digits/)
    expect(printed).toMatch(/storage\.file_size_limit\s+50 MiB → 10 MiB/)
  })

  it('apply changes only the settings that differ, then matches', async () => {
    expect(await main('apply')).toBe(0)
    const patches = calls.filter((c) => c.startsWith('PATCH'))
    expect(patches).toHaveLength(2)
    const authPatch = JSON.parse(patches[0].slice(patches[0].indexOf('{')))
    expect(Object.keys(authPatch).sort()).toEqual(['disable_signup', 'password_min_length', 'password_required_characters', 'site_url', 'uri_allow_list'])
    expect(state.auth.jwt_exp).toBe(3600) // not declared, not touched
    expect(state.storage.features).toEqual({ imageTransformation: { enabled: true } })
    expect(await main('diff')).toBe(0)
  })

  it('apply does nothing when the project already matches', async () => {
    await main('apply')
    calls.length = 0
    expect(await main('apply')).toBe(0)
    expect(calls.some((c) => c.startsWith('PATCH'))).toBe(false)
  })

  it('explains a rejected token', async () => {
    process.env.SUPABASE_ACCESS_TOKEN = 'sbp_wrong'
    await expect(main('diff')).rejects.toThrow(/rejected the access token/)
  })
})
