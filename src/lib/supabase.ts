import { createClient } from '@supabase/supabase-js'

// En local : VITE_* (voir .env.example). Sur Vercel : NEXT_PUBLIC_*, posées
// automatiquement par l'intégration Supabase de la Marketplace Vercel.
// Toujours lire import.meta.env.NOM_EXACT : Vite ne remplace alors que cette
// variable, au lieu d'embarquer tout l'objet import.meta.env dans le bundle.
const url =
  import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.NEXT_PUBLIC_SUPABASE_URL
const publishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !publishableKey) {
  throw new Error(
    'Configuration Supabase manquante : définir VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY (voir .env.example).',
  )
}

/** Client Supabase côté navigateur, avec la clé publique (RLS active). */
export const supabase = createClient(url, publishableKey)

export function photoUrl(path: string | null) {
  if (!path) return null
  return supabase.storage.from('photos').getPublicUrl(path).data.publicUrl
}
