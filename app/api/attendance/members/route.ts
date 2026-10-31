import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole, dbError } from '@/lib/auth/guards'
import { PAGE_ACCESS } from '@/lib/auth/roles'
import { cleanSearch, pageRange } from '@/lib/api/validation'
import { ROSTER_FIELDS, nameFilter, rosterQuery, toRosterMember } from '@/lib/api/attendance'

// The roster for taking attendance: active members (name and member number only, nothing else from the
// profile), each with their saved record for the chosen event and day.
// ?event_id=&date=&search=&limit=&offset= → { members, total }
export async function GET(req: Request) {
  const auth = await requireRole(...PAGE_ACCESS.attendance)
  if (auth.error) return auth.error
  const { searchParams } = new URL(req.url)
  const parsed = rosterQuery.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', issues: z.flattenError(parsed.error) }, { status: 400 })
  }
  const search = cleanSearch(searchParams.get('search'))

  let query = auth.supabase
    .from('profiles')
    .select(ROSTER_FIELDS, { count: 'exact' })
    .eq('is_active', true)
    // filters on the embedded records: every member comes back, with this event's record for that day if any
    .eq('attendance_records.event_id', parsed.data.event_id)
    .eq('attendance_records.attendance_date', parsed.data.date)
  if (search) query = query.or(nameFilter(search))

  const { data, error, count } = await query
    .order('first_name')
    .order('last_name')
    .order('id')
    .range(...pageRange(searchParams, 50))
  if (error) return dbError(error)
  return NextResponse.json({ members: (data ?? []).map(toRosterMember), total: count ?? 0 })
}
