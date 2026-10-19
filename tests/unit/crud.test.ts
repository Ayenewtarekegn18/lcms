import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

// A tiny stand-in for the Supabase query builder: records calls, returns the queued result.
const calls: string[] = []
let result: { data: unknown; error: unknown } = { data: null, error: null }
const builder = {
  update: (v: unknown) => { calls.push(`update ${JSON.stringify(v)}`); return builder },
  delete: () => { calls.push('delete'); return builder },
  eq: (c: string, v: unknown) => { calls.push(`eq ${c}=${v}`); return builder },
  select: () => builder,
  maybeSingle: async () => result,
  then: (resolve: (r: typeof result) => void) => resolve(result),
}
const supabase = { from: (t: string) => { calls.push(`from ${t}`); return builder } }

vi.mock('@/lib/auth/guards', async () => {
  const { NextResponse } = await import('next/server')
  return {
    requireRole: vi.fn(async () => ({ error: null, supabase, user: { id: 'u1' }, role: 'admin' })),
    dbError: (e: { message: string }) => NextResponse.json({ error: 'Server error', detail: e.message }, { status: 500 }),
  }
})

const { itemRoutes } = await import('@/lib/api/crud')
const { requireRole } = await import('@/lib/auth/guards')
const ID = '00000000-0000-4000-8000-000000000001'
const ctx = (id = ID) => ({ params: Promise.resolve({ id }) })
const json = (body: unknown) => new Request('http://x', { method: 'PATCH', body: JSON.stringify(body) })
const item = itemRoutes({ table: 'things', roles: ['admin'], update: z.object({ title: z.string() }).partial().strict() })

beforeEach(() => { calls.length = 0; result = { data: null, error: null } })

describe('itemRoutes PATCH', () => {
  it('updates whitelisted fields only and returns the row', async () => {
    result = { data: { id: ID, title: 'new' }, error: null }
    const res = await item.PATCH(json({ title: 'new' }), ctx())
    expect(res.status).toBe(200)
    expect(calls).toEqual(['from things', 'update {"title":"new"}', `eq id=${ID}`])
  })
  it('rejects unknown keys such as role', async () => {
    const res = await item.PATCH(json({ title: 'x', role: 'admin' }), ctx())
    expect(res.status).toBe(400)
    expect(calls).toEqual([])
  })
  it('rejects an empty update', async () => {
    expect((await item.PATCH(json({}), ctx())).status).toBe(400)
  })
  it('404s for a malformed id or a row RLS hides', async () => {
    expect((await item.PATCH(json({ title: 'x' }), ctx('nope'))).status).toBe(404)
    result = { data: null, error: null }
    expect((await item.PATCH(json({ title: 'x' }), ctx())).status).toBe(404)
  })
  it('returns the guard response when the role check fails', async () => {
    const { NextResponse } = await import('next/server')
    vi.mocked(requireRole).mockResolvedValueOnce({ error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) } as never)
    expect((await item.PATCH(json({ title: 'x' }), ctx())).status).toBe(403)
  })
})

describe('itemRoutes DELETE', () => {
  it('deletes and reports ok', async () => {
    result = { data: [{ id: ID }], error: null }
    const res = await item.DELETE(new Request('http://x'), ctx())
    expect(res.status).toBe(200)
    expect(calls).toContain('delete')
  })
  it('404s when nothing was deleted', async () => {
    result = { data: [], error: null }
    expect((await item.DELETE(new Request('http://x'), ctx())).status).toBe(404)
  })
  it('soft-deletes when configured', async () => {
    result = { data: [{ id: ID }], error: null }
    const soft = itemRoutes({ table: 'memberships', roles: ['admin'], update: z.object({}).strict(), softDelete: true })
    await soft.DELETE(new Request('http://x'), ctx())
    expect(calls).toContain('update {"is_active":false}')
    expect(calls).not.toContain('delete')
  })
})
