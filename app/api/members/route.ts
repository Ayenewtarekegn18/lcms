import { NextResponse } from 'next/server'
import { requireRole, dbError } from '@/lib/auth/guards'
import { parseBody, pageRange, cleanSearch } from '@/lib/api/validation'
import { profileUpdate } from '@/lib/api/schemas'

export async function GET(req: Request) {
  const auth = await requireRole('admin', 'elder', 'ministry_leader', 'finance')
  if (auth.error) return auth.error
  const { searchParams } = new URL(req.url)
  const search = cleanSearch(searchParams.get('search'))

  let query = auth.supabase
    .from('profiles')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
  }
  const { data, error } = await query.range(...pageRange(searchParams))
  if (error) return dbError(error)
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  // Update the caller's own profile (same rules as PATCH /api/profile).
  // Registering members is POST /api/members/register.
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
