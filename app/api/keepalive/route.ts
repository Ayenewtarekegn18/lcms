import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Keep-warm endpoint for the free Supabase plan: one trivial database call (public.keepalive(),
// which reads no data). Called every 10-15 minutes by .github/workflows/keepalive.yml and,
// optionally, an external uptime monitor. Returns 503 when the database is unreachable, so the
// same URL works as a health check.
export const dynamic = 'force-dynamic'

export async function GET() {
  const started = Date.now()
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await supabase.rpc('keepalive')
  const headers = { 'Cache-Control': 'no-store' }
  if (error) {
    console.error('[keepalive]', error.code, error.message)
    return NextResponse.json({ ok: false, ms: Date.now() - started }, { status: 503, headers })
  }
  return NextResponse.json({ ok: true, db_time: data, ms: Date.now() - started }, { headers })
}
