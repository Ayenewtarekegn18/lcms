import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(req.url)
  const activeOnly = searchParams.get('active') === 'true'

  let query = supabase
    .from('ministries')
    .select('*')
    .order('name', { ascending: true })

  if (activeOnly) {
    query = query.eq('is_active', true)
  }

  const { data: ministries, error } = await query

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }

  return NextResponse.json(ministries)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { data: ministry, error } = await supabase
    .from('ministries')
    .insert([
      {
        name: body.name,
        description: body.description,
        leader_id: body.leader_id || null,
        meeting_day: body.meeting_day ?? body.meeting_schedule ?? null,
        meeting_time: body.meeting_time ?? null,
        location: body.location ?? null,
        is_active: true,
      },
    ])
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }

  return NextResponse.json(ministry, { status: 201 })
}
