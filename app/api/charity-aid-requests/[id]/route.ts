import { NextResponse } from 'next/server'
import { itemRoutes } from '@/lib/api/crud'
import { charityAidRequestUpdate } from '@/lib/api/schemas'
import { requireRole, dbError } from '@/lib/auth/guards'
import { notFound, parseBody, parseId } from '@/lib/api/validation'
import { PASTORAL } from '@/lib/auth/roles'
import { reviewStamp } from '@/lib/ministries/charity'

type Context = { params: Promise<{ id: string }> }

// Change or delete an aid request (admin and elder, like the confidential RLS group). When the status
// changes to approved or rejected the server records the signed-in user and the time as the review
// (reviewed_by_id, reviewed_at); back to pending clears it. The body never carries those columns.
export async function PATCH(req: Request, { params }: Context) {
  const auth = await requireRole(...PASTORAL)
  if (auth.error) return auth.error
  const id = parseId((await params).id)
  if (!id) return notFound()
  const body = await parseBody(req, charityAidRequestUpdate)
  if (body.error) return body.error
  if (Object.keys(body.data).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const requests = () => auth.supabase.from('charity_aid_requests')
  let stamp = null
  if (body.data.status !== undefined) {
    // Only a real change of status is a decision: re-saving an approved request keeps its reviewer.
    const { data: current, error } = await requests().select('status').eq('id', id).maybeSingle()
    if (error) return dbError(error)
    if (!current) return notFound()
    stamp = reviewStamp(current.status, body.data.status, auth.user.id)
  }

  const { data, error } = await requests().update({ ...body.data, ...stamp }).eq('id', id).select().maybeSingle()
  if (error) return dbError(error)
  if (!data) return notFound()
  return NextResponse.json(data)
}

// Deleting a request also deletes its distributions (ON DELETE CASCADE).
const item = itemRoutes({ table: 'charity_aid_requests', roles: PASTORAL, update: charityAidRequestUpdate })
export const DELETE = item.DELETE
