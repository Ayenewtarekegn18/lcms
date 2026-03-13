import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data || [])
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single()

  const authorName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || user.email
    : user.email || 'Unknown'

  const channels = Array.isArray(body.channels) ? body.channels : (body.channels ? [body.channels] : ['Email'])

  const { data: announcement, error } = await supabase
    .from('announcements')
    .insert([
      {
        title: body.title,
        content: body.content,
        recipients: body.recipients ?? 'All Members',
        channels,
        author_id: user.id,
        author_name: authorName,
        status: body.status ?? 'Published',
        views: 0,
      },
    ])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(announcement, { status: 201 })
}
