import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { type Role, toRole } from '@/lib/auth/roles'

/**
 * Current user and role. role is null when signed out or deactivated; an unreadable
 * profile falls back to 'member' (least privilege).
 */
export async function getSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, role: null, inactive: false }

  // select('*') so this works before profiles.role exists (legacy is_admin fallback in toRole)
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (profile?.is_active === false) return { supabase, user, role: null, inactive: true }
  return { supabase, user, role: toRole(profile?.role, profile?.is_admin), inactive: false }
}

/**
 * Route handlers: `const auth = await requireRole('admin', 'finance'); if (auth.error) return auth.error`
 * No roles = any signed-in, active user.
 */
export async function requireRole(...allowed: Role[]) {
  const { supabase, user, role } = await getSession()
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) } as const
  }
  if (!role || (allowed.length > 0 && !allowed.includes(role))) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) } as const
  }
  return { error: null, supabase, user, role } as const
}

/** Server components / layouts: redirect instead of returning a response. */
export async function requirePageRole(...allowed: readonly Role[]) {
  const session = await getSession()
  if (!session.user) redirect('/auth/login')
  if (!session.role || (allowed.length > 0 && !allowed.includes(session.role))) redirect('/dashboard')
  return session
}

/** Map Supabase/PostgREST errors to safe HTTP responses (no table/column names leak). */
export function dbError(error: { code?: string; message: string }) {
  console.error('[db]', error.code, error.message)
  if (error.code === '42501') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (error.code === 'PGRST116') return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (error.code === '23505') return NextResponse.json({ error: 'Already exists' }, { status: 409 })
  if (error.code?.startsWith('23')) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  return NextResponse.json({ error: 'Server error' }, { status: 500 })
}
