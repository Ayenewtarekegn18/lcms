'use server'

import { createClient } from '@/lib/supabase/server'

/** Ends the session on the server, which clears the auth cookies. */
export async function signOut(): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  return error ? { error: 'Could not log out. Please try again.' } : {}
}
