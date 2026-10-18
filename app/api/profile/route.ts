import { NextResponse } from 'next/server'
import { requireRole, dbError } from '@/lib/auth/guards'
import { parseBody } from '@/lib/api/validation'
import { profileUpdate } from '@/lib/api/schemas'

export async function GET() {
  const auth = await requireRole()
  if (auth.error) return auth.error

  const { data, error } = await auth.supabase.from('profiles').select('*').eq('id', auth.user.id).single()
  if (error) return dbError(error)
  return NextResponse.json(data)
}

// Only the fields in profileUpdate can change. Keys such as role, is_admin, is_active or id
// are rejected (they used to be written straight from the request body).
export async function PATCH(req: Request) {
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
