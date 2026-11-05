import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | undefined

/**
 * Browser Supabase client, using the public key (RLS enforced). Created on
 * first use, so the mock data source runs without any Supabase config.
 */
export function getSupabase() {
  if (client) return client

  // Locally: .env (see .env.example). On Vercel: set by the Supabase integration
  // of the Vercel Marketplace, with the public VITE_ prefix
  // (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
  // Always read import.meta.env.EXACT_NAME: Vite then only replaces that
  // variable, instead of inlining the whole import.meta.env object in the bundle.
  const url = import.meta.env.VITE_SUPABASE_URL
  const publishableKey =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url || !publishableKey) {
    throw new Error(
      'Missing Supabase config: set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (see .env.example).',
    )
  }

  client = createClient(url, publishableKey, {
    // Keeps the tokens out of the callback URL of the Google sign-in.
    auth: { flowType: 'pkce' },
  })
  return client
}

export function photoUrl(path: string | null) {
  if (!path) return null
  return getSupabase().storage.from('photos').getPublicUrl(path).data.publicUrl
}
