import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isOverdue, taskStatusLabel } from '@/lib/ministries/administration'
import { aidStatusLabel, charityTotals, reviewStamp } from '@/lib/ministries/charity'

// A stand-in for the Supabase query builder: records calls, answers reads with `current`, writes with `written`.
const calls: string[] = []
let current: { data: unknown; error: unknown } = { data: null, error: null }
let written: { data: unknown; error: unknown } = { data: null, error: null }
let writing = false
const builder = {
  select: (s?: string) => { if (!writing) calls.push(`select ${s}`); return builder },
  update: (v: Record<string, unknown>) => {
    writing = true
    const shown = { ...v, ...(typeof v.reviewed_at === 'string' ? { reviewed_at: 'NOW' } : {}) }
    calls.push(`update ${JSON.stringify(shown)}`)
    return builder
  },
  eq: (c: string, v: unknown) => { calls.push(`eq ${c}=${v}`); return builder },
  maybeSingle: async () => (writing ? written : current),
}
const supabase = { from: (t: string) => { calls.push(`from ${t}`); writing = false; return builder } }

vi.mock('@/lib/auth/guards', async () => {
  const { NextResponse } = await import('next/server')
  return {
    requireRole: vi.fn(async () => ({ error: null, supabase, user: { id: 'reviewer-1' }, role: 'elder' })),
    dbError: (e: { message: string }) => NextResponse.json({ error: 'Server error', detail: e.message }, { status: 500 }),
  }
})

const { PATCH } = await import('@/app/api/charity-aid-requests/[id]/route')
const { requireRole } = await import('@/lib/auth/guards')
const { adminTaskCreate, charityAidRequestCreate, charityAidRequestUpdate, charityDistributionCreate } = await import('@/lib/api/schemas')

const ID = '00000000-0000-4000-8000-000000000001'
const ctx = { params: Promise.resolve({ id: ID }) }
const patch = (body: unknown) => PATCH(new Request('http://x', { method: 'PATCH', body: JSON.stringify(body) }), ctx)

beforeEach(() => {
  calls.length = 0
  current = { data: { status: 'pending' }, error: null }
  written = { data: { id: ID }, error: null }
})

describe('administration tasks', () => {
  it('is overdue only when the due day has passed and it is not completed', () => {
    expect(isOverdue({ due_date: '2026-10-31', status: 'pending' }, '2026-11-01')).toBe(true)
    expect(isOverdue({ due_date: '2026-10-31', status: 'in_progress' }, '2026-11-01')).toBe(true)
    expect(isOverdue({ due_date: '2026-11-01', status: 'pending' }, '2026-11-01')).toBe(false)
    expect(isOverdue({ due_date: '2026-10-31', status: 'completed' }, '2026-11-01')).toBe(false)
    expect(isOverdue({ due_date: null, status: 'pending' }, '2026-11-01')).toBe(false)
  })
  it('labels statuses, keeping unknown legacy values', () => {
    expect(taskStatusLabel('in_progress')).toBe('In progress')
    expect(taskStatusLabel(null)).toBe('Pending')
    expect(taskStatusLabel('Waiting')).toBe('Waiting')
  })
  it('accepts only the known statuses and refuses unknown keys', () => {
    expect(adminTaskCreate.safeParse({ title: 'Report', status: 'completed', due_date: '', assigned_to_id: null }).success).toBe(true)
    expect(adminTaskCreate.safeParse({ title: 'Report', status: 'done' }).success).toBe(false)
    expect(adminTaskCreate.safeParse({ title: 'Report', created_at: '2026-01-01' }).success).toBe(false)
  })
})

describe('charity review stamp', () => {
  const now = new Date('2026-11-01T08:00:00Z')
  it('records the reviewer when a request is approved or rejected', () => {
    expect(reviewStamp('pending', 'approved', 'u1', now)).toEqual({ reviewed_by_id: 'u1', reviewed_at: '2026-11-01T08:00:00.000Z' })
    expect(reviewStamp('approved', 'rejected', 'u1', now)).toEqual({ reviewed_by_id: 'u1', reviewed_at: '2026-11-01T08:00:00.000Z' })
  })
  it('clears it when going back to pending and keeps it otherwise', () => {
    expect(reviewStamp('approved', 'pending', 'u1', now)).toEqual({ reviewed_by_id: null, reviewed_at: null })
    expect(reviewStamp('approved', 'approved', 'u1', now)).toBeNull()
    expect(reviewStamp('approved', 'paid', 'u1', now)).toBeNull()
    expect(reviewStamp('pending', undefined, 'u1', now)).toBeNull()
  })
  it('labels statuses', () => {
    expect(aidStatusLabel('paid')).toBe('Paid')
    expect(aidStatusLabel(undefined)).toBe('Pending')
  })
})

describe('charity totals', () => {
  it('adds amounts exactly in cents and counts pending requests', () => {
    const totals = charityTotals(
      [{ amount_requested: 0.1, status: 'pending' }, { amount_requested: '0.2', status: 'approved' }, { amount_requested: null, status: 'pending' }],
      [{ amount: 100.05 }, { amount: '0.95' }],
    )
    expect(totals).toEqual({ requested: 0.3, requests: 3, pending: 2, paid: 101, distributions: 2 })
  })
  it('is all zero without rows', () => {
    expect(charityTotals([], [])).toEqual({ requested: 0, requests: 0, pending: 0, paid: 0, distributions: 0 })
  })
})

describe('charity schemas', () => {
  const member = '00000000-0000-4000-8000-000000000002'
  it('never accept the server-owned review columns', () => {
    expect(charityAidRequestCreate.safeParse({ member_id: member, reviewed_by_id: member }).success).toBe(false)
    expect(charityAidRequestUpdate.safeParse({ reviewed_at: '2026-11-01T00:00:00Z' }).success).toBe(false)
    expect(charityAidRequestUpdate.safeParse({ member_id: member }).success).toBe(false)
  })
  it('check statuses and amounts', () => {
    expect(charityAidRequestCreate.safeParse({ member_id: member, amount_requested: 1500, status: 'paid' }).success).toBe(true)
    expect(charityAidRequestCreate.safeParse({ member_id: member, status: 'closed' }).success).toBe(false)
    expect(charityDistributionCreate.safeParse({ request_id: member, distributed_date: '2026-11-01', amount: 0 }).success).toBe(false)
    expect(charityDistributionCreate.safeParse({ request_id: member, distributed_date: '2026-11-01', amount: 1e9 }).success).toBe(false)
  })
})

describe('PATCH /api/charity-aid-requests/[id]', () => {
  it('stamps the signed-in reviewer when the status changes to approved', async () => {
    const res = await patch({ status: 'approved' })
    expect(res.status).toBe(200)
    expect(calls).toEqual([
      'from charity_aid_requests', 'select status', `eq id=${ID}`,
      'from charity_aid_requests', 'update {"status":"approved","reviewed_by_id":"reviewer-1","reviewed_at":"NOW"}', `eq id=${ID}`,
    ])
  })
  it('keeps the review when an approved request is saved again', async () => {
    current = { data: { status: 'approved' }, error: null }
    await patch({ status: 'approved', reason: 'Rent' })
    expect(calls).toContain('update {"reason":"Rent","status":"approved"}')
  })
  it('does not read the status when it is not changed', async () => {
    await patch({ reason: 'Rent' })
    expect(calls).toEqual(['from charity_aid_requests', 'update {"reason":"Rent"}', `eq id=${ID}`])
  })
  it('404s for a request RLS hides, 400s for client-sent review columns', async () => {
    current = { data: null, error: null }
    expect((await patch({ status: 'rejected' })).status).toBe(404)
    expect((await patch({ reviewed_by_id: ID })).status).toBe(400)
  })
  it('returns the guard response for other roles', async () => {
    const { NextResponse } = await import('next/server')
    vi.mocked(requireRole).mockResolvedValueOnce({ error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) } as never)
    expect((await patch({ status: 'approved' })).status).toBe(403)
  })
})
