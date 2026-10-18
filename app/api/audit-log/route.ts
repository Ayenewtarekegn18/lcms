import { NextResponse } from 'next/server'
import { requireRole, dbError } from '@/lib/auth/guards'
import { PAGE_ACCESS } from '@/lib/auth/roles'

// Read-only. Audit rows are written by database triggers
// (docs/remediation/sql/03_audit_log.sql), so they can't be skipped or forged
// from the browser. There is deliberately no POST handler.

export async function GET(req: Request) {
  const auth = await requireRole(...PAGE_ACCESS.auditLog)
  if (auth.error) return auth.error

  const { searchParams } = new URL(req.url)
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '', 10) || 100, 1), 500)
  const resourceType = searchParams.get('resource_type')?.replace(/[^a-z_]/g, '').slice(0, 64)

  let query = auth.supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (resourceType) query = query.eq('resource_type', resourceType)

  // A missing audit_log table surfaces as an error: an empty log would look clean.
  const { data, error } = await query
  if (error) return dbError(error)
  return NextResponse.json(data ?? [])
}
