import { NextResponse } from 'next/server'
import { requireRole, dbError } from '@/lib/auth/guards'
import { STAFF } from '@/lib/auth/roles'
import { cleanSearch } from '@/lib/api/validation'

type Details = { member_number: string }
type Row = { id: string; first_name: string | null; last_name: string | null; member_details: Details | Details[] | null }

// Name lookup for the spouse field: name and member number only, nothing else (as in lebu-form).
export async function GET(req: Request) {
  const auth = await requireRole(...STAFF)
  if (auth.error) return auth.error
  const q = cleanSearch(new URL(req.url).searchParams.get('q'))
  if (!q || q.length < 2) return NextResponse.json([])

  const { data, error } = await auth.supabase
    .from('profiles')
    .select('id, first_name, last_name, member_details!member_details_member_id_fkey(member_number)')
    .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
    .eq('is_active', true)
    .limit(8)
  if (error) return dbError(error)
  return NextResponse.json(
    ((data ?? []) as unknown as Row[]).map((r) => ({
      id: r.id,
      name: [r.first_name, r.last_name].filter(Boolean).join(' '),
      memberNumber: (Array.isArray(r.member_details) ? r.member_details[0] : r.member_details)?.member_number ?? null,
    })),
  )
}
