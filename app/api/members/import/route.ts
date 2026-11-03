import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole, dbError } from '@/lib/auth/guards'
import { REGISTRARS } from '@/lib/auth/roles'
import { readJson, tooLarge } from '@/lib/api/validation'
import { IMPORT_BATCH, prepareImport, type ImportResult } from '@/lib/members/registration'

// Import lebu-form records from the app (Members → Import). Each record is checked with the
// registration form's rules (lib/members/registration.ts → prepareImport) and created by
// register_member() under its existing number, so printed ID cards stay valid. Safe to repeat:
// numbers that are already in the register are reported and left alone.

const MAX_BYTES = 512 * 1024

const body = z.object({
  members: z.array(z.record(z.string(), z.unknown())).min(1).max(IMPORT_BATCH),
  /** Number new registrations with this prefix from now on (the imported records' prefix). */
  prefix: z.string().regex(/^[A-Z0-9]{1,10}$/).optional(),
}).strict()

// The prefix new registrations get, and the number the next one will have.
export async function GET() {
  const auth = await requireRole(...REGISTRARS)
  if (auth.error) return auth.error
  const [setting, next] = await Promise.all([
    auth.supabase.from('church_settings').select('value').eq('key', 'member_prefix').maybeSingle(),
    auth.supabase.rpc('peek_next_member_number'),
  ])
  if (setting.error) return dbError(setting.error)
  if (next.error) return dbError(next.error)
  return NextResponse.json({ prefix: setting.data?.value || 'LKH', next: next.data })
}

export async function POST(req: Request) {
  const auth = await requireRole(...REGISTRARS)
  if (auth.error) return auth.error

  const raw = await readJson(req, MAX_BYTES)
  if (raw.tooLarge) return tooLarge()
  const parsed = body.safeParse(raw.value)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request', issues: z.flattenError(parsed.error) }, { status: 400 })

  const results: ImportResult[] = []
  for (const record of parsed.data.members) {
    const prepared = prepareImport(record)
    const { number, label } = prepared
    if (!prepared.ok) { results.push({ number, label, status: 'failed', error: prepared.error }); continue }

    const { data: existing, error: lookupError } = await auth.supabase.from('member_details').select('member_id').eq('member_number', number).maybeSingle()
    if (lookupError) return dbError(lookupError)
    if (existing) { results.push({ number, label, status: 'exists', id: existing.member_id }); continue }

    const { data, error } = await auth.supabase.rpc('register_member', { payload: { ...prepared.data, memberNumber: number } })
    if (error) {
      console.error('[import]', number, error.code, error.message)
      results.push({ number, label, status: error.code === '23505' ? 'exists' : 'failed', error: error.code === '23505' ? undefined : 'the database refused this record' })
      continue
    }
    const created = data as { id: string }
    results.push({ number, label, status: 'imported', id: created.id, dropped: prepared.dropped.length ? prepared.dropped : undefined })
  }

  if (parsed.data.prefix) {
    const { error } = await auth.supabase.from('church_settings').update({ value: parsed.data.prefix }).eq('key', 'member_prefix')
    if (error) return dbError(error)
  }
  return NextResponse.json({ results })
}
