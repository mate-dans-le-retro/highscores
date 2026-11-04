import { queryOptions, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { source } from './data'
import type { ChangedTable, SubmissionInput } from './data/types'

export type {
  AllTimeRecord,
  DisplayedGame,
  Game,
  GameRecord,
  LeaderboardRow,
  NewRecord,
  ScoreType,
  Settings,
  SubmissionInput,
} from './data/types'
export { findNewRecords } from './data/records'
export { formatScore, formatStation } from './format'

export const visibleGamesQuery = queryOptions({
  queryKey: ['games', 'visible'],
  queryFn: () => source.listVisibleGames(),
})

export const leaderboardQuery = (gameId: string, limit = 10) =>
  queryOptions({
    queryKey: ['leaderboard', gameId, limit],
    queryFn: () => source.getLeaderboard(gameId, limit),
  })

/** Current, runner-up and all-time record of each visible game (record wall, new record). */
export const recordsQuery = queryOptions({
  queryKey: ['records'],
  queryFn: () => source.listRecords(),
})

export const settingsQuery = queryOptions({
  queryKey: ['settings'],
  queryFn: () => source.getSettings(),
})

/** Sends a pending submission; a volunteer approves it before it shows. */
export const submitScore = (input: SubmissionInput) => source.submitScore(input)

export const photoUrl = (path: string | null) => source.photoUrl(path)

const invalidatedBy: Record<ChangedTable, Array<string>> = {
  games: ['games', 'leaderboard', 'records'],
  scores: ['leaderboard', 'records'],
  settings: ['settings'],
}

/** Refreshes the queries as soon as a score, a game or a setting changes. */
export function useHighscoresRealtime() {
  const queryClient = useQueryClient()

  useEffect(
    () =>
      source.subscribe((table) => {
        for (const key of invalidatedBy[table])
          void queryClient.invalidateQueries({ queryKey: [key] })
      }),
    [queryClient],
  )
}
