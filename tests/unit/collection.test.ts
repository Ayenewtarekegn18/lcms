import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

// A stand-in for the Supabase query builder: records each call, returns the queued result.
const calls: string[] = []
let result: { data: unknown; error: unknown; count?: number | null } = { data: [], error: null, count: 0 }
const builder = {
  select: (s: string, o?: { count?: string }) => { calls.push(`select ${s}${o?.count ? ` count=${o.count}` : ''}`); return builder },
  insert: (v: unknown) => { calls.push(`insert ${JSON.stringify(v)}`); return builder },
  upsert: (v: unknown, o: { onConflict: string }) => { calls.push(`upsert ${JSON.stringify(v)} on ${o.onConflict}`); return builder },
  eq: (c: string, v: unknown) => { calls.push(`eq ${c}=${v}`); return builder },
  or: (f: string, o?: { referencedTable?: string }) => { calls.push(`or ${f}${o?.referencedTable ? ` in ${o.referencedTable}` : ''}`); return builder },
  order: (c: string, o?: { ascending?: boolean }) => { calls.push(`order ${c}${o?.ascending === false ? ' desc' : ''}`); return builder },
  range: (a: number, b: number) => { calls.push(`range ${a}-${b}`); return builder },
  single: async () => result,
  then: (resolve: (r: typeof result) => void) => resolve(result),
}
const supabase = { from: (t: string) => { calls.push(`from ${t}`); return builder } }

vi.mock('@/lib/auth/guards', async () => {
  const { NextResponse } = await import('next/server')
  return {
    requireRole: vi.fn(async () => ({ error: null, supabase, user: { id: 'user-1' }, role: 'admin' })),
    dbError: (e: { message: string }) => NextResponse.json({ error: 'Server error', detail: e.message }, { status: 500 }),
  }
})

const { collectionRoutes, readFilters, searchFilters } = await import('@/lib/api/collection')
const { requireRole } = await import('@/lib/auth/guards')
const MINISTRY = '00000000-0000-4000-8000-000000000001'

const songs = collectionRoutes({
  table: 'choir_songs',
  roles: { read: ['admin', 'member'], write: ['admin'] },
  create: z.object({ title: z.string().min(1) }).strict(),
  search: { columns: ['title', 'composer'] },
  order: { column: 'title' },
})
const get = (query = '') => new Request(`http://x/api/choir-songs${query}`)
const post = (body: unknown) => new Request('http://x/api/choir-songs', { method: 'POST', body: JSON.stringify(body) })

beforeEach(() => {
  calls.length = 0
  result = { data: [], error: null, count: 0 }
  vi.mocked(requireRole).mockClear()
})

describe('searchFilters', () => {
  it('makes one or-filter per word over every column', () => {
    expect(searchFilters(['title', 'composer'], 'amazing grace')).toEqual([
      'title.ilike.%amazing%,composer.ilike.%amazing%',
      'title.ilike.%grace%,composer.ilike.%grace%',
    ])
  })
  it('is empty without words or columns', () => {
    expect(searchFilters(['title'], null)).toEqual([])
    expect(searchFilters([], 'x')).toEqual([])
  })
  it('keeps at most five words', () => {
    expect(searchFilters(['t'], 'a b c d e f g')).toHaveLength(5)
  })
})

describe('readFilters', () => {
  const allowed = { ministry_id: z.string().uuid(), status: z.enum(['open', 'closed']) }
  it('returns only allowed, valid filters', () => {
    const q = new URLSearchParams({ ministry_id: MINISTRY, status: 'open', role: 'admin' })
    expect(readFilters(q, allowed)).toEqual({ values: { ministry_id: MINISTRY, status: 'open' }, error: null })
  })
  it('names an invalid value', () => {
    expect(readFilters(new URLSearchParams({ ministry_id: 'nope' }), allowed).error).toBe('Invalid ministry_id')
  })
  it('names a missing required filter', () => {
    expect(readFilters(new URLSearchParams(), allowed, ['ministry_id']).error).toBe('ministry_id required')
  })
})

describe('collectionRoutes GET', () => {
  it('lists a page in order with the total in X-Total-Count', async () => {
    result = { data: [{ id: 'a' }], error: null, count: 7 }
    const res = await songs.GET(get('?limit=10&offset=20'))
    expect(res.status).toBe(200)
    expect(res.headers.get('X-Total-Count')).toBe('7')
    expect(await res.json()).toEqual([{ id: 'a' }])
    expect(calls).toEqual(['from choir_songs', 'select * count=exact', 'order title', 'order id', 'range 20-29'])
    expect(requireRole).toHaveBeenCalledWith('admin', 'member')
  })

  it('searches with cleaned text', async () => {
    await songs.GET(get('?search=' + encodeURIComponent('grace),id.eq.1')))
    expect(calls).toContain('or title.ilike.%graceid.eq.1%,composer.ilike.%graceid.eq.1%')
  })

  it('applies allowed filters and fixed conditions, ignores unknown parameters', async () => {
    const members = collectionRoutes({
      table: 'ministry_members',
      roles: { read: ['admin'], write: ['admin'] },
      create: z.object({}).strict(),
      select: '*, member:profiles!member_id!inner(first_name)',
      filters: { ministry_id: z.string().uuid() },
      required: ['ministry_id'],
      where: { is_active: true },
      search: { columns: ['first_name'], referencedTable: 'member' },
      order: [{ column: 'role' }, { column: 'joined_date', ascending: false }],
    })
    await members.GET(get(`?ministry_id=${MINISTRY}&role=x&search=abe`))
    expect(calls).toEqual([
      'from ministry_members',
      'select *, member:profiles!member_id!inner(first_name) count=exact',
      'eq is_active=true',
      `eq ministry_id=${MINISTRY}`,
      'or first_name.ilike.%abe% in member',
      'order role',
      'order joined_date desc',
      'order id',
      'range 0-199',
    ])
    expect((await members.GET(get())).status).toBe(400) // ministry_id is required
    expect((await members.GET(get('?ministry_id=1'))).status).toBe(400)
  })

  it('returns the guard response when the role check fails', async () => {
    const { NextResponse } = await import('next/server')
    vi.mocked(requireRole).mockResolvedValueOnce({ error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) } as never)
    expect((await songs.GET(get())).status).toBe(403)
    expect(calls).toEqual([])
  })

  it('maps database errors', async () => {
    result = { data: null, error: { message: 'boom' }, count: null }
    expect((await songs.GET(get())).status).toBe(500)
  })
})

describe('collectionRoutes POST', () => {
  it('inserts the parsed body and answers 201 with the row', async () => {
    result = { data: { id: 'new', title: 'Song' }, error: null }
    const res = await songs.POST(post({ title: 'Song' }))
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ id: 'new', title: 'Song' })
    expect(calls).toEqual(['from choir_songs', 'insert [{"title":"Song"}]', 'select *'])
    expect(requireRole).toHaveBeenCalledWith('admin')
  })

  it('refuses unknown keys and invalid bodies before touching the database', async () => {
    expect((await songs.POST(post({ title: 'x', created_by_id: 'someone' }))).status).toBe(400)
    expect((await songs.POST(post({ title: '' }))).status).toBe(400)
    expect(calls).toEqual([])
  })

  it('sets the owner from the session and server defaults, overriding the body', async () => {
    const tasks = collectionRoutes({
      table: 'ministry_members',
      roles: { read: ['admin'], write: ['admin'] },
      create: z.object({ member_id: z.string(), is_active: z.boolean().optional() }).strict(),
      owner: 'created_by_id',
      defaults: { is_active: true },
      upsertOn: 'ministry_id,member_id',
    })
    result = { data: { id: 'r' }, error: null }
    await tasks.POST(post({ member_id: 'm', is_active: false }))
    expect(calls).toContain('upsert [{"member_id":"m","is_active":true,"created_by_id":"user-1"}] on ministry_id,member_id')
  })

  it('returns the guard response for a role without write access', async () => {
    const { NextResponse } = await import('next/server')
    vi.mocked(requireRole).mockResolvedValueOnce({ error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) } as never)
    expect((await songs.POST(post({ title: 'x' }))).status).toBe(403)
    expect(calls).toEqual([])
  })
})
