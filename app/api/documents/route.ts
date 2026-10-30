import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole, dbError } from '@/lib/auth/guards'
import { STAFF } from '@/lib/auth/roles'
import { parseId, notFound, pageRange, cleanSearch } from '@/lib/api/validation'

const BUCKET = 'documents'
const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
])

const uploadFields = z
  .object({
    name: z.string().trim().min(1).max(200),
    category: z.string().trim().max(100).nullable(),
    access_level: z.enum(['Public', 'Staff Only', 'Leadership Only']),
  })
  .strict()

// Who sees which document is decided by RLS on access_level (see docs/ROLES_AND_ACCESS.md).
export async function GET(req: Request) {
  const auth = await requireRole()
  if (auth.error) return auth.error
  const { searchParams } = new URL(req.url)

  const idParam = searchParams.get('id')
  if (idParam) {
    const id = parseId(idParam)
    if (!id) return notFound()
    const { data: doc, error } = await auth.supabase.from('documents').select('*').eq('id', id).maybeSingle()
    if (error) return dbError(error)
    if (!doc) return notFound()
    const { data: signed } = await auth.supabase.storage.from(BUCKET).createSignedUrl(doc.file_path, 60)
    return NextResponse.json({ ...doc, downloadUrl: signed?.signedUrl ?? null })
  }

  const category = searchParams.get('category')
  const search = cleanSearch(searchParams.get('search'))
  let query = auth.supabase.from('documents').select('*').order('created_at', { ascending: false })
  if (category && category !== 'All') query = query.eq('category', category.slice(0, 100))
  if (search) query = query.ilike('name', `%${search}%`)
  const { data, error } = await query.range(...pageRange(searchParams))
  if (error) return dbError(error)
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const auth = await requireRole(...STAFF)
  if (auth.error) return auth.error

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'A file is required' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File is larger than 10 MB' }, { status: 413 })
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'This file type is not allowed' }, { status: 415 })
  }
  const fields = uploadFields.safeParse({
    name: form?.get('name'),
    category: (form?.get('category') as string | null) || null,
    access_level: form?.get('access_level') || 'Staff Only',
  })
  if (!fields.success) {
    return NextResponse.json({ error: 'Invalid request', issues: z.flattenError(fields.error) }, { status: 400 })
  }

  // Storage key from the original file name, stripped to safe characters.
  const safeFileName = file.name.replace(/[^\w.-]+/g, '-').slice(-100)
  const filePath = `${auth.user.id}/${Date.now()}-${safeFileName}`

  const { error: uploadError } = await auth.supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { contentType: file.type, upsert: false })
  if (uploadError) {
    console.error('[storage]', uploadError.message)
    return NextResponse.json({ error: 'Upload failed' }, { status: 400 })
  }

  const { data: doc, error } = await auth.supabase
    .from('documents')
    .insert([{
      name: fields.data.name,
      category: fields.data.category,
      file_path: filePath,
      file_size_bytes: file.size,
      content_type: file.type,
      uploaded_by_id: auth.user.id,
      access_level: fields.data.access_level,
    }])
    .select()
    .single()
  if (error) {
    await auth.supabase.storage.from(BUCKET).remove([filePath]) // don't leave an orphaned file
    return dbError(error)
  }
  return NextResponse.json(doc, { status: 201 })
}
