import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !publishableKey) {
  throw new Error(
    'VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY doivent être définis (voir .env.example).',
  )
}

/** Client Supabase côté navigateur, avec la clé publique (RLS active). */
export const supabase = createClient(url, publishableKey)

export function photoUrl(path: string | null) {
  if (!path) return null
  return supabase.storage.from('photos').getPublicUrl(path).data.publicUrl
}
