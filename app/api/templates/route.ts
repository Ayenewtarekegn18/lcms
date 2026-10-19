import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole, dbError } from '@/lib/auth/guards'
import { STAFF } from '@/lib/auth/roles'
import { parseBody, opt, text } from '@/lib/api/validation'

const createSchema = z
  .object({
    name: text(100),
    title: opt(z.string().trim().max(200)),
    body: text(10000),
  })
  .strict()

export async function GET() {
  const auth = await requireRole(...STAFF)
  if (auth.error) return auth.error

  const { data, error } = await auth.supabase.from('message_templates').select('*').order('name', { ascending: true }).limit(500)
  if (error) return dbError(error)
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const auth = await requireRole(...STAFF)
  if (auth.error) return auth.error
  const body = await parseBody(req, createSchema)
  if (body.error) return body.error

  const { data, error } = await auth.supabase
    .from('message_templates')
    .insert([{ ...body.data, title: body.data.title ?? body.data.name }])
    .select()
    .single()
  if (error) return dbError(error)
  return NextResponse.json(data, { status: 201 })
}
