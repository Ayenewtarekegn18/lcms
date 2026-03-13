import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const BUCKET = 'documents'

export async function GET(req: Request) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const category = searchParams.get('category')
  const search = searchParams.get('search')

  if (id) {
    const { data: doc, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !doc) {
      return NextResponse.json({ error: error?.message || 'Not found' }, { status: 404 })
    }
    const { data: signed } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(doc.file_path, 60)
    return NextResponse.json({ ...doc, downloadUrl: signed?.signedUrl ?? null })
  }

  let query = supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })

  if (category && category !== 'All') {
    query = query.eq('category', category)
  }

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data || [])
}

export async function POST(req: Request) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const name = formData.get('name') as string | null
  const category = formData.get('category') as string | null
  const access_level = (formData.get('access_level') as string) || 'Staff Only'

  if (!file || !name?.trim()) {
    return NextResponse.json(
      { error: 'File and name are required' },
      { status: 400 }
    )
  }

  const safeName = name.trim().replace(/\s+/g, '-')
  const filePath = `${user.id}/${Date.now()}-${safeName}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { contentType: file.type, upsert: false })

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message || 'Upload failed' },
      { status: 400 }
    )
  }

  const { data: doc, error: insertError } = await supabase
    .from('documents')
    .insert([
      {
        name: file.name,
        category: category?.trim() || null,
        file_path: filePath,
        file_size_bytes: file.size,
        content_type: file.type,
        uploaded_by_id: user.id,
        access_level,
      },
    ])
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 })
  }

  return NextResponse.json(doc, { status: 201 })
}
