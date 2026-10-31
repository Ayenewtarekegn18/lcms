import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Role } from '@/lib/auth/roles'

// A stand-in for the Supabase query builder: records each call, resolves to the queued result.
const calls: string[] = []
let result: { data: unknown; error: unknown } = { data: null, error: null }
const record = (name: string) => (...args: unknown[]) => {
  calls.push(`${name} ${args.map((a) => JSON.stringify(a)).join(' ')}`.trim())
  return builder
}
const builder: Record<string, unknown> = {
  then: (resolve: (r: typeof result) => void) => resolve(result),
  single: async () => result,
  maybeSingle: async () => result,
}
for (const name of ['select', 'insert', 'update', 'delete', 'eq', 'not', 'or', 'lt', 'order', 'range']) builder[name] = record(name)
const supabase = { from: (t: string) => { calls.push(`from ${t}`); return builder } }

const USER = '00000000-0000-4000-8000-000000000001'
const EVENT = '00000000-0000-4000-8000-000000000002'
let role: Role = 'admin'

vi.mock('@/lib/auth/guards', async () => {
  const { NextResponse } = await import('next/server')
  return {
    // Same contract as the real guard: no roles = any signed-in user.
    requireRole: vi.fn(async (...allowed: Role[]) =>
      allowed.length && !allowed.includes(role)
        ? { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
        : { error: null, supabase, user: { id: USER }, role }),
    dbError: () => NextResponse.json({ error: 'Server error' }, { status: 500 }),
  }
})

const events = await import('@/app/api/events/route')
const item = await import('@/app/api/events/[id]/route')
const { EVENT_SELECT } = await import('@/lib/events/schema')

const get = (query = '') => events.GET(new Request(`http://x/api/events${query}`))
const send = (method: string, body: unknown) => new Request('http://x/api/events', { method, body: JSON.stringify(body) })
const ctx = { params: Promise.resolve({ id: EVENT }) }
const valid = { title: 'Choir rehearsal', start_date: '2026-11-03T15:00:00+03:00', ministry_id: USER }

beforeEach(() => {
  calls.length = 0
  result = { data: null, error: null }
  role = 'admin'
})

describe('GET /api/events', () => {
  it('reads one calendar month with the ministry name, soonest first, for any signed-in role', async () => {
    role = 'member'
    result = { data: [{ id: EVENT }], error: null }
    const res = await get('?from=2026-10-31T21:00:00.000Z&to=2026-11-30T21:00:00.000Z&limit=500')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ id: EVENT }])
    expect(calls).toEqual([
      'from events',
      `select ${JSON.stringify(EVENT_SELECT)}`,
      'not "is_active" "is" false',
      'or "end_date.gte.2026-10-31T21:00:00.000Z,start_date.gte.2026-10-31T21:00:00.000Z"',
      'lt "start_date" "2026-11-30T21:00:00.000Z"',
      'order "start_date" {"ascending":true}',
      'order "id" {"ascending":true}',
      'range 0 499',
    ])
  })
  it('lists newest first without a window', async () => {
    await get('?offset=50&limit=50')
    expect(calls).toContain('order "start_date" {"ascending":false}')
    expect(calls).toContain('range 50 99')
    expect(calls.some((c) => c.startsWith('or ') || c.startsWith('lt '))).toBe(false)
  })
  it('refuses a malformed window before querying', async () => {
    expect((await get('?from=2026-10-01T00:00:00Z,id.eq.x')).status).toBe(400)
    expect((await get('?order=random')).status).toBe(400)
    expect(calls).toEqual([])
  })
})

describe('POST /api/events', () => {
  it('saves the event with the signed-in organizer and the display columns', async () => {
    result = { data: { id: EVENT }, error: null }
    const res = await events.POST(send('POST', valid))
    expect(res.status).toBe(201)
    const insert = calls.find((c) => c.startsWith('insert '))!
    expect(JSON.parse(insert.slice('insert '.length))).toEqual({
      ...valid, event_type: 'Other', event_date: '2026-11-03', event_time: '15:00', organizer_id: USER,
    })
    expect(calls).toContain(`select ${JSON.stringify(EVENT_SELECT)}`)
  })
  it('never takes the organizer (or the old ministry text column) from the body', async () => {
    for (const extra of [{ organizer_id: EVENT }, { ministry: 'Choir' }]) {
      const res = await events.POST(send('POST', { ...valid, ...extra }))
      expect(res.status).toBe(400)
    }
    const missingStart = await events.POST(send('POST', { title: 'No start' }))
    expect(missingStart.status).toBe(400)
    expect(calls).toEqual([])
  })
  it('is refused to roles outside PAGE_ACCESS.events', async () => {
    for (const r of ['member', 'finance'] as Role[]) {
      role = r
      expect((await events.POST(send('POST', valid))).status).toBe(403)
    }
    role = 'ministry_leader'
    result = { data: { id: EVENT }, error: null }
    expect((await events.POST(send('POST', valid))).status).toBe(201)
  })
})

describe('PATCH and DELETE /api/events/[id]', () => {
  it('updates the start together with its display columns', async () => {
    result = { data: { id: EVENT }, error: null }
    const res = await item.PATCH(send('PATCH', { start_date: '2026-11-04T18:30:00+03:00', ministry_id: null }), ctx)
    expect(res.status).toBe(200)
    expect(calls).toContain(`update ${JSON.stringify({ start_date: '2026-11-04T18:30:00+03:00', ministry_id: null, event_date: '2026-11-04', event_time: '18:30' })}`)
    expect(calls).toContain(`eq "id" "${EVENT}"`)
  })
  it('refuses members and server-owned fields', async () => {
    role = 'member'
    expect((await item.PATCH(send('PATCH', { title: 'x' }), ctx)).status).toBe(403)
    expect((await item.DELETE(new Request('http://x', { method: 'DELETE' }), ctx)).status).toBe(403)
    role = 'elder'
    expect((await item.PATCH(send('PATCH', { organizer_id: USER }), ctx)).status).toBe(400)
    expect(calls).toEqual([])
  })
  it('deletes for staff', async () => {
    role = 'ministry_leader'
    result = { data: [{ id: EVENT }], error: null }
    expect((await item.DELETE(new Request('http://x', { method: 'DELETE' }), ctx)).status).toBe(200)
    expect(calls).toContain('delete')
  })
})
