import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

export function createClient() {
  // In browser, Next.js exposes NEXT_PUBLIC_ vars via process.env
  // But we need to ensure they're actually available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMsg = `Missing Supabase environment variables. 
    
Please check your .env.local file and ensure:
- NEXT_PUBLIC_SUPABASE_URL is set
- NEXT_PUBLIC_SUPABASE_ANON_KEY is set

Then restart your dev server with: npm run dev`

    console.error('❌', errorMsg)
    throw new Error(errorMsg)
  }

  // Validate URL format (any absolute URL: hosted, custom domain, or local `supabase start` / test stack)
  try {
    new URL(supabaseUrl)
  } catch {
    throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL: ' + supabaseUrl)
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
