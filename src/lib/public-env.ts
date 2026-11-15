/**
 * Public (browser-safe) Supabase env.
 * Same names as `getSupabase()`: Vercel Marketplace sets the VITE_ prefix.
 */
export function publicSupabaseUrl() {
  return import.meta.env.VITE_SUPABASE_URL || undefined
}

export function publicSupabaseAnonKey() {
  return (
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    undefined
  )
}
