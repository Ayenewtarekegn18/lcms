import { NextResponse } from 'next/server'
import { requireRole, dbError } from '@/lib/auth/guards'
import { STAFF } from '@/lib/auth/roles'
import { parseBody, pageRange, cleanSearch } from '@/lib/api/validation'
import { profileUpdate } from '@/lib/api/schemas'
import { DIRECTORY_SELECT, directoryFilters, type DirectoryMember } from '@/lib/members/directory'

// The directory of active members: the same readers as the profiles_select policy (staff, and
// finance to link gifts to givers). Registry details and ministries come back where RLS shows them.
//   ?search=  every word must match a name, the email or the phone
//   ?order=name  alphabetical (member pickers); newest first otherwise
//   ?limit=&offset=  one page; the number of matching members is in X-Total-Count
export async function GET(req: Request) {
  const auth = await requireRole(...STAFF, 'finance')
  if (auth.error) return auth.error
  const { searchParams } = new URL(req.url)

  let query = auth.supabase.from('profiles').select(DIRECTORY_SELECT, { count: 'exact' }).eq('is_active', true)
  for (const filter of directoryFilters(cleanSearch(searchParams.get('search')))) query = query.or(filter)
  query = searchParams.get('order') === 'name'
    ? query.order('first_name').order('last_name')
    : query.order('created_at', { ascending: false })
  const { data, error, count } = await query.order('id').range(...pageRange(searchParams))
  if (error) return dbError(error)

  const members: DirectoryMember[] = data ?? []
  return NextResponse.json(members, { headers: { 'X-Total-Count': String(count ?? members.length) } })
}

export async function POST(req: Request) {
  // Update the caller's own profile (same rules as PATCH /api/profile).
  // Registering members is POST /api/members/register; editing others is PATCH /api/members/[id].
  const auth = await requireRole()
  if (auth.error) return auth.error
  const body = await parseBody(req, profileUpdate)
  if (body.error) return body.error

  const { data, error } = await auth.supabase
    .from('profiles')
    .update(body.data)
    .eq('id', auth.user.id)
    .select()
    .single()
  if (error) return dbError(error)
  return NextResponse.json(data)
}
