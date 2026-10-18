import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole, dbError } from '@/lib/auth/guards'
import { parseBody, pageRange, cleanSearch, opt, text, date } from '@/lib/api/validation'
import { profileUpdate } from '@/lib/api/schemas'

// Registering a member creates a profile row; RLS allows that for admins only.
const registration = z
  .object({
    action: z.literal('create'),
    first_name: text(100),
    last_name: text(100),
    email: opt(z.string().trim().email().max(200)),
    phone: opt(z.string().trim().max(30)),
    date_of_birth: opt(date),
    gender: opt(z.string().trim().max(20)),
    address: opt(z.string().trim().max(300)),
    city: opt(z.string().trim().max(100)),
    country: opt(z.string().trim().max(100)),
  })
  .strict()

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
  const raw = await req.clone().json().catch(() => null)

  // Register a new member (admin only)
  if (raw && raw.action === 'create') {
    const auth = await requireRole('admin')
    if (auth.error) return auth.error
    const body = await parseBody(req, registration)
    if (body.error) return body.error

    const fields: Partial<typeof body.data> = { ...body.data }
    delete fields.action
    const { data, error } = await auth.supabase
      .from('profiles')
      .insert([{ ...fields, is_active: true }])
      .select()
      .single()
    if (error) return dbError(error)
    return NextResponse.json(data, { status: 201 })
  }

  // Otherwise: update the caller's own profile (same rules as PATCH /api/profile)
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
