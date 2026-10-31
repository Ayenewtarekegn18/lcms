import { NextResponse } from 'next/server'
import { itemRoutes } from '@/lib/api/crud'
import { profileUpdate } from '@/lib/api/schemas'
import { parseId, notFound } from '@/lib/api/validation'
import { requireRole, dbError } from '@/lib/auth/guards'
import { MEMBER_EDITORS } from '@/lib/auth/roles'

type Context = { params: Promise<{ id: string }> }

// Editing someone else's profile: MEMBER_EDITORS only, as in the profiles_update policy (RLS).
// The fields are the profileUpdate whitelist, so role, is_admin, is_active and id can't be sent.
// People change their own profile through /api/profile.
const item = itemRoutes({ table: 'profiles', roles: MEMBER_EDITORS, update: profileUpdate })
export const PATCH = item.PATCH

// Deactivate (is_active = false): profiles are never deleted, so their history stays. The member
// leaves the directory and their account, if they have one, loses access to the app.
export async function DELETE(_req: Request, { params }: Context) {
  const auth = await requireRole(...MEMBER_EDITORS)
  if (auth.error) return auth.error
  const id = parseId((await params).id)
  if (!id) return notFound()
  // It would lock the admin out straight away (and could remove the last admin).
  if (id === auth.user.id) {
    return NextResponse.json({ error: 'You cannot deactivate your own account.' }, { status: 400 })
  }

  const { data, error } = await auth.supabase.from('profiles').update({ is_active: false }).eq('id', id).select('id')
  if (error) return dbError(error)
  if (!data?.length) return notFound()
  return NextResponse.json({ ok: true })
}
