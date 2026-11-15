import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'

import { publicSupabaseAnonKey, publicSupabaseUrl } from '#/lib/public-env'

/**
 * Lightweight DB ping for Home Assistant (keeps the Supabase project awake).
 * Mirrors Tournoi `/api/keepalive`: anon client, select 1 id, no auth.
 */
async function keepalive() {
  const supabaseUrl = publicSupabaseUrl()
  const supabaseKey = publicSupabaseAnonKey()

  if (!supabaseUrl || !supabaseKey) {
    return Response.json(
      { message: 'Missing Supabase config', status: 'error' },
      { status: 500 },
    )
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const { data, error } = await supabase.from('games').select('id').limit(1)

    if (error) {
      console.error('Supabase keepalive failed:', error)
      throw error
    }

    return Response.json(
      { length: data.length, status: 'success' },
      { status: 200 },
    )
  } catch (error) {
    return Response.json(
      { message: (error as Error).message, status: 'error' },
      { status: 500 },
    )
  }
}

export const Route = createFileRoute('/api/keepalive')({
  server: {
    handlers: {
      GET: () => keepalive(),
    },
  },
})
