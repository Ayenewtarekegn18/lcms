import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole, dbError } from '@/lib/auth/guards'
import { STAFF } from '@/lib/auth/roles'
import { parseBody, pageRange, opt, text } from '@/lib/api/validation'

const createSchema = z
  .object({
    title: text(200),
    content: text(10000),
    recipients: opt(z.string().trim().max(100)),
    channels: opt(z.union([z.array(z.string().trim().min(1).max(30)).max(10), z.string().trim().min(1).max(30)])),
    status: opt(z.string().trim().max(50)),
  })
  .strict()

export async function GET(req: Request) {
  const auth = await requireRole()
  if (auth.error) return auth.error
  const { searchParams } = new URL(req.url)

  const { data, error } = await auth.supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .range(...pageRange(searchParams))
  if (error) return dbError(error)
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const auth = await requireRole(...STAFF)
  if (auth.error) return auth.error
  const body = await parseBody(req, createSchema)
  if (body.error) return body.error

  const { data: profile } = await auth.supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', auth.user.id)
    .maybeSingle()
  const authorName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || auth.user.email || 'Unknown'
  const { channels } = body.data

  const { data, error } = await auth.supabase
    .from('announcements')
    .insert([{
      title: body.data.title,
      content: body.data.content,
      recipients: body.data.recipients ?? 'All Members',
      channels: Array.isArray(channels) ? channels : channels ? [channels] : ['Email'],
      author_id: auth.user.id,
      author_name: authorName,
      status: body.data.status ?? 'Published',
      views: 0,
    }])
    .select()
    .single()
  if (error) return dbError(error)
  return NextResponse.json(data, { status: 201 })
}
