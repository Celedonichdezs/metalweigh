import { createBrowserClient } from '@supabase/ssr'

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    throw new Error('Supabase client can only be used in the browser')
  }

  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      throw new Error('Supabase environment variables are not configured')
    }

    supabaseInstance = createBrowserClient(url, key)
  }

  return supabaseInstance
}
