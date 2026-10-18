import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole, dbError } from '@/lib/auth/guards'
import { STAFF } from '@/lib/auth/roles'
import { parseBody, pageRange, opt, text } from '@/lib/api/validation'

const createSchema = z
  .object({
    title: text(200),
    composer: opt(z.string().trim().max(200)),
    lyrics_url: opt(z.string().trim().url().max(500)),
  })
  .strict()

export async function GET(req: Request) {
  const auth = await requireRole()
  if (auth.error) return auth.error
  const { searchParams } = new URL(req.url)

  const { data, error } = await auth.supabase
    .from('choir_songs')
    .select('*')
    .order('title')
    .range(...pageRange(searchParams))
  if (error) return dbError(error)
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const auth = await requireRole(...STAFF)
  if (auth.error) return auth.error
  const body = await parseBody(req, createSchema)
  if (body.error) return body.error

  const { data, error } = await auth.supabase.from('choir_songs').insert([body.data]).select().single()
  if (error) return dbError(error)
  return NextResponse.json(data, { status: 201 })
}
