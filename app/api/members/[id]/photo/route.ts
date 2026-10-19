import { NextResponse } from 'next/server'
import { requireRole, dbError } from '@/lib/auth/guards'
import { REGISTRARS, STAFF } from '@/lib/auth/roles'
import { parseId, notFound } from '@/lib/api/validation'

const BUCKET = 'member-photos'
const MAX_BYTES = 2 * 1024 * 1024
const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

type Context = { params: Promise<{ id: string }> }

// Short-lived link to a member's photo (staff only; the bucket is private).
export async function GET(_req: Request, { params }: Context) {
  const auth = await requireRole(...STAFF)
  if (auth.error) return auth.error
  const id = parseId((await params).id)
  if (!id) return notFound()

  const { data: details, error } = await auth.supabase.from('member_details').select('photo_path').eq('member_id', id).maybeSingle()
  if (error) return dbError(error)
  if (!details?.photo_path) return notFound()
  const { data: signed } = await auth.supabase.storage.from(BUCKET).createSignedUrl(details.photo_path, 60)
  return NextResponse.json({ url: signed?.signedUrl ?? null })
}

// Store the 4:5 portrait the form produced (replaces any earlier photo).
export async function POST(req: Request, { params }: Context) {
  const auth = await requireRole(...REGISTRARS)
  if (auth.error) return auth.error
  const id = parseId((await params).id)
  if (!id) return notFound()

  const form = await req.formData().catch(() => null)
  const photo = form?.get('photo')
  if (!(photo instanceof File) || photo.size === 0) return NextResponse.json({ error: 'A photo is required' }, { status: 400 })
  if (photo.size > MAX_BYTES) return NextResponse.json({ error: 'That photo is too large' }, { status: 413 })
  if (!TYPES.has(photo.type)) return NextResponse.json({ error: 'That photo was not an image' }, { status: 415 })

  const { data: details, error: lookupError } = await auth.supabase.from('member_details').select('member_id').eq('member_id', id).maybeSingle()
  if (lookupError) return dbError(lookupError)
  if (!details) return notFound()

  const path = `${id}.jpg`
  const { error: uploadError } = await auth.supabase.storage.from(BUCKET).upload(path, photo, { contentType: photo.type, upsert: true })
  if (uploadError) {
    console.error('[storage]', uploadError.message)
    return NextResponse.json({ error: 'Upload failed' }, { status: 400 })
  }
  const { error } = await auth.supabase.from('member_details').update({ photo_path: path }).eq('member_id', id)
  if (error) return dbError(error)
  return NextResponse.json({ photo_path: path })
}
