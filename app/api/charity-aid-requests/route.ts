import { NextResponse } from 'next/server'
import { z } from 'zod'
import { collectionRoutes } from '@/lib/api/collection'
import { charityAidRequestCreate } from '@/lib/api/schemas'
import { requireRole, dbError } from '@/lib/auth/guards'
import { parseBody } from '@/lib/api/validation'
import { PASTORAL } from '@/lib/auth/roles'
import { AID_STATUSES, reviewStamp } from '@/lib/ministries/charity'

// Charity aid requests are confidential: admin and elder only, for reading and writing (RLS:
// charity_aid_requests is in the confidential group).
//   GET ?status= &member_id= &search= (member's name) &limit=&offset=
//   POST { member_id, request_date?, amount_requested?, reason?, status? }; approving or rejecting
//   records the signed-in user as the reviewer, with the time (reviewed_by_id, reviewed_at).
const AID_REQUEST_SELECT =
  '*, member:profiles!member_id!inner(id, first_name, last_name), reviewer:profiles!reviewed_by_id(id, first_name, last_name)'

const list = collectionRoutes({
  table: 'charity_aid_requests',
  roles: { read: PASTORAL, write: PASTORAL },
  create: charityAidRequestCreate,
  select: AID_REQUEST_SELECT,
  filters: { status: z.enum(AID_STATUSES), member_id: z.string().uuid() },
  search: { columns: ['first_name', 'last_name'], referencedTable: 'member' },
  order: [{ column: 'request_date', ascending: false }, { column: 'created_at', ascending: false }],
})
export const GET = list.GET

export async function POST(req: Request) {
  const auth = await requireRole(...PASTORAL)
  if (auth.error) return auth.error
  const body = await parseBody(req, charityAidRequestCreate)
  if (body.error) return body.error

  const { data, error } = await auth.supabase
    .from('charity_aid_requests')
    .insert([{ ...body.data, ...reviewStamp('pending', body.data.status, auth.user.id) }])
    .select(AID_REQUEST_SELECT)
    .single()
  if (error) return dbError(error)
  return NextResponse.json(data, { status: 201 })
}
