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
  const search = searchParams.get('search')
  const ministry = searchParams.get('ministry')

  let query = supabase
    .from('profiles')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
    )
  }

  if (ministry) {
    // TODO: once a ministry/primary_ministry column is added to profiles,
    // re-enable filtering here. For now we skip this to avoid querying
    // a non-existent column in the current schema.
    // query = query.eq('ministry', ministry)
  }

  const { data: members, error } = await query

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }

  return NextResponse.json(members)
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

  // Create new member (registration flow from admin)
  if (body.action === 'create') {
    const {
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      gender,
      address,
      city,
      country,
    } = body

    if (!first_name || !last_name) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      )
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .insert([
        {
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          email: email?.trim() || null,
          phone: phone?.trim() || null,
          date_of_birth: date_of_birth || null,
          gender: gender || null,
          address: address?.trim() || null,
          city: city?.trim() || null,
          country: country?.trim() || null,
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

    return NextResponse.json(profile, { status: 201 })
  }

  // Update current user's profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .update({
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      phone: body.phone,
      date_of_birth: body.date_of_birth,
      gender: body.gender,
    })
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }

  return NextResponse.json(profile, { status: 201 })
}
