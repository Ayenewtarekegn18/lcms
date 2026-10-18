import { NextResponse } from 'next/server'
import { itemRoutes } from '@/lib/api/crud'
import { spiritualCandidate } from '@/lib/api/schemas'
import { parseId, notFound } from '@/lib/api/validation'
import { requireRole, dbError } from '@/lib/auth/guards'
import { STAFF } from '@/lib/auth/roles'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(...STAFF)
  if (auth.error) return auth.error
  const id = parseId((await params).id)
  if (!id) return notFound()

  const { data, error } = await auth.supabase
    .from('spiritual_candidates')
    .select('*, member:profiles!member_id(id, first_name, last_name, email, phone), mentor:profiles!mentor_id(id, first_name, last_name)')
    .eq('id', id)
    .maybeSingle()
  if (error) return dbError(error)
  if (!data) return notFound()
  return NextResponse.json(data)
}

const item = itemRoutes({
  table: 'spiritual_candidates',
  roles: STAFF,
  update: spiritualCandidate.omit({ member_id: true }).partial(),
  touchUpdatedAt: true,
})
export const PATCH = item.PATCH
export const DELETE = item.DELETE
