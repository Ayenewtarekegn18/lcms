import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // In browser, Next.js exposes NEXT_PUBLIC_ vars via process.env
  // But we need to ensure they're actually available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Debug logging (always log in development to help debug)
  if (typeof window !== 'undefined') {
    console.log('🔍 Supabase Client Debug:', {
      url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '❌ MISSING',
      key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : '❌ MISSING',
      hasWindow: true,
      nodeEnv: process.env.NODE_ENV,
    })
    
    // Also log the actual values (truncated) to verify they're loaded
    if (supabaseUrl && supabaseAnonKey) {
      console.log('✅ Environment variables are loaded correctly')
    } else {
      console.error('❌ Environment variables are NOT loaded in browser!')
      console.error('This usually means:')
      console.error('1. Dev server needs restart')
      console.error('2. .env.local file is missing or incorrect')
      console.error('3. Variables not prefixed with NEXT_PUBLIC_')
    }
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMsg = `Missing Supabase environment variables. 
    
Please check your .env.local file and ensure:
- NEXT_PUBLIC_SUPABASE_URL is set
- NEXT_PUBLIC_SUPABASE_ANON_KEY is set

Then restart your dev server with: npm run dev`

    console.error('❌', errorMsg)
    throw new Error(errorMsg)
  }

  // Validate URL format
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    console.error('❌ Invalid Supabase URL format:', supabaseUrl)
    throw new Error('Invalid Supabase URL format. Should be: https://your-project.supabase.co')
  }

  try {
    const client = createBrowserClient(supabaseUrl, supabaseAnonKey)
    console.log('✅ Supabase client created successfully')
    return client
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error)
    throw error
  }
}
