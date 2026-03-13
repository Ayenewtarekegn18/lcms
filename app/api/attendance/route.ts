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
  const memberId = searchParams.get('member_id')
  const eventId = searchParams.get('event_id')
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')

  let query = supabase
    .from('attendance')
    .select('*')
    .order('attendance_date', { ascending: false })

  if (memberId) {
    query = query.eq('member_id', memberId)
  }

  if (eventId) {
    query = query.eq('event_id', eventId)
  }

  if (startDate) {
    query = query.gte('attendance_date', startDate)
  }

  if (endDate) {
    query = query.lte('attendance_date', endDate)
  }

  const { data: attendance, error } = await query

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }

  return NextResponse.json(attendance)
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

  // Handle bulk attendance records
  if (Array.isArray(body)) {
    const records = body.map((record) => ({
      member_id: record.member_id,
      event_id: record.event_id,
      attendance_date: record.attendance_date || new Date().toISOString(),
      status: record.status || 'present',
      recorded_by: user.id,
    }))

    const { data: attendance, error } = await supabase
      .from('attendance')
      .insert(records)
      .select()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(attendance, { status: 201 })
  }

  // Handle single attendance record
  const { data: attendance, error } = await supabase
    .from('attendance')
    .insert([
      {
        member_id: body.member_id,
        event_id: body.event_id,
        attendance_date: body.attendance_date || new Date().toISOString(),
        status: body.status || 'present',
        recorded_by: user.id,
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

  return NextResponse.json(attendance, { status: 201 })
}
