import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { action, resource_type, resource_id, details } = body

  if (!action || !resource_type) {
    return NextResponse.json(
      { error: 'action and resource_type are required' },
      { status: 400 }
    )
  }

  const { error } = await supabase.from('audit_log').insert([
    {
      user_id: user.id,
      user_email: user.email,
      action,
      resource_type,
      resource_id: resource_id ?? null,
      details: details ?? null,
    },
  ])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function GET(req: Request) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.is_admin === true

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500)
  const resourceType = searchParams.get('resource_type')

  let query = supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (resourceType) {
    query = query.eq('resource_type', resourceType)
  }

  const { data, error } = await query

  if (error) {
    const msg = error.message || ''
    // Missing `audit_log` table (migration not applied) — empty list so the page loads
    const missingAuditTable =
      /audit_log/i.test(msg) &&
      (msg.includes('does not exist') ||
        msg.includes('schema cache') ||
        msg.includes('not found'))
    if (missingAuditTable) {
      return NextResponse.json([])
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data || [])
}
