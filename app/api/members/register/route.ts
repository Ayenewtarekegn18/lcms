import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole, dbError } from '@/lib/auth/guards'
import { REGISTRARS } from '@/lib/auth/roles'
import { registrationSchema, cleanRegistration, emptyRegistration } from '@/lib/members/registration'
import { readJson, tooLarge } from '@/lib/api/validation'

// The number the next registration will get (shown on the form; nothing is reserved).
export async function GET() {
  const auth = await requireRole(...REGISTRARS)
  if (auth.error) return auth.error
  const { data, error } = await auth.supabase.rpc('peek_next_member_number')
  if (error) return dbError(error)
  return NextResponse.json({ next: data })
}

// Register a member: same fields and rules as the lebu-form register (lib/members/registration.ts).
// The profile and the registry row are created together by register_member(); the member number
// comes from a database sequence, so it can never collide.
export async function POST(req: Request) {
  const auth = await requireRole(...REGISTRARS)
  if (auth.error) return auth.error

  const body = await readJson(req)
  if (body.tooLarge) return tooLarge()
  const raw = body.value
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const parsed = registrationSchema.safeParse(cleanRegistration({ ...emptyRegistration(), ...raw }))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', issues: z.flattenError(parsed.error) }, { status: 400 })
  }

  const { data, error } = await auth.supabase.rpc('register_member', { payload: parsed.data })
  if (error) return dbError(error)
  return NextResponse.json(data, { status: 201 })
}
