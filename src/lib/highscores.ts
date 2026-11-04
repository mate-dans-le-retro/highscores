import { queryOptions, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { supabase } from './supabase'

// Hand-written types until we run `supabase gen types` on the MDLR project.
export interface Game {
  id: string
  slug: string
  name: string
  machine: string | null
  score_order: 'desc' | 'asc'
  score_unit: string | null
  visible: boolean
  position: number
  cover_path: string | null
}

export interface LeaderboardRow {
  id: string
  game_id: string
  player_name: string
  score: number
  photo_path: string | null
  created_at: string
  rank: number
}

export const visibleGamesQuery = queryOptions({
  queryKey: ['games', 'visible'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('visible', true)
      .order('position')
    if (error) throw error
    return data as Array<Game>
  },
})

export const leaderboardQuery = (gameId: string, limit = 10) =>
  queryOptions({
    queryKey: ['leaderboard', gameId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('game_id', gameId)
        .order('rank')
        .limit(limit)
      if (error) throw error
      return data as Array<LeaderboardRow>
    },
  })

/** Refreshes games and leaderboards as soon as a score or a game changes in the database. */
export function useHighscoresRealtime() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('highscores')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scores' },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games' },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['games'] })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [queryClient])
}

const scoreFormatter = new Intl.NumberFormat('fr-FR')

export function formatScore(score: number) {
  return scoreFormatter.format(score)
}
