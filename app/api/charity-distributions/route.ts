import { NextResponse } from 'next/server'
import { z } from 'zod'
import { collectionRoutes } from '@/lib/api/collection'
import { charityDistributionCreate } from '@/lib/api/schemas'
import { requireRole, dbError } from '@/lib/auth/guards'
import { parseBody } from '@/lib/api/validation'
import { PASTORAL } from '@/lib/auth/roles'
import { PAYABLE_STATUSES } from '@/lib/ministries/charity'

// Money paid out against aid requests: confidential, admin and elder only (RLS: charity_distributions
// is in the confidential group).   GET ?request_id= &limit=&offset=
//   POST { request_id, distributed_date, amount, notes? }: the request must be approved (or already paid).
const DISTRIBUTION_SELECT =
  '*, request:charity_aid_requests!request_id(id, amount_requested, status, member:profiles!member_id(id, first_name, last_name))'

const list = collectionRoutes({
  table: 'charity_distributions',
  roles: { read: PASTORAL, write: PASTORAL },
  create: charityDistributionCreate,
  select: DISTRIBUTION_SELECT,
  filters: { request_id: z.string().uuid() },
  search: { columns: ['notes'] },
  order: [{ column: 'distributed_date', ascending: false }, { column: 'created_at', ascending: false }],
})
export const GET = list.GET

export async function POST(req: Request) {
  const auth = await requireRole(...PASTORAL)
  if (auth.error) return auth.error
  const body = await parseBody(req, charityDistributionCreate)
  if (body.error) return body.error

  const { data: request, error: readError } = await auth.supabase
    .from('charity_aid_requests').select('status').eq('id', body.data.request_id).maybeSingle()
  if (readError) return dbError(readError)
  if (!request || !(PAYABLE_STATUSES as readonly string[]).includes(request.status)) {
    return NextResponse.json(
      { error: 'Only an approved aid request can be paid out', issues: { fieldErrors: { request_id: ['Choose an approved request'] } } },
      { status: 400 },
    )
  }

  const { data, error } = await auth.supabase.from('charity_distributions').insert([body.data]).select(DISTRIBUTION_SELECT).single()
  if (error) return dbError(error)
  return NextResponse.json(data, { status: 201 })
}
