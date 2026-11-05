import { queryOptions, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { isMock, source } from './data'
import { mockTools } from './data/mock/mock-source'
import type { LeaderboardQueryOptions } from './data/source'
import type { ChangedTable, SubmissionInput } from './data/types'
import { reloadWhenReachable } from './reload-when-reachable'

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
export type {
  ScreenLeaderboard,
  ScreenLeaderboardRow,
} from './data/screen-leaderboard'
export { buildScreenLeaderboard } from './data/screen-leaderboard'
export {
  anonymousName,
  normalizePlayerName,
  CHARACTERS_BY_SLUG,
  gameSlugFromId,
} from './data/anonymous-name'
export { findNewRecords } from './data/records'
export { DEFAULT_SETTINGS } from './data/source'
export { formatScore, formatScoreWhen, formatStation } from './format'
export { isMock }
export type { MockPendingScore } from './data/mock/mock-source'
export { mockTools }

export const visibleGamesQuery = queryOptions({
  queryKey: ['games', 'visible'],
  queryFn: () => source.listVisibleGames(),
})

/** Pending submissions for the mock /dev panel. Empty outside mock mode. */
export const pendingSubmissionsQuery = queryOptions({
  queryKey: ['pending'],
  queryFn: () => (isMock ? mockTools.listPending() : Promise.resolve([])),
})

export const leaderboardQuery = (
  gameId: string,
  options: LeaderboardQueryOptions = {},
) =>
  queryOptions({
    queryKey: [
      'leaderboard',
      gameId,
      options.rows ?? null,
      options.minAllTimeRows ?? null,
    ],
    queryFn: () => source.getLeaderboard(gameId, options),
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
  games: ['games', 'leaderboard', 'records', 'pending'],
  scores: ['leaderboard', 'records', 'pending'],
  settings: ['settings'],
}

/**
 * Refreshes the queries as soon as a score, a game or a setting changes.
 * When the live connection comes back after a drop, refetches everything to
 * catch up on the signals missed meanwhile. With `reloadAfterMs`, reloads the
 * page if the connection stays lost that long.
 */
export function useHighscoresRealtime({
  reloadAfterMs,
}: { reloadAfterMs?: number } = {}) {
  const queryClient = useQueryClient()

  useEffect(() => {
    let lost = false
    let cancelReload: (() => void) | null = null

    const unsubscribe = source.subscribe(
      (table) => {
        for (const key of invalidatedBy[table])
          void queryClient.invalidateQueries({ queryKey: [key] })
      },
      (status) => {
        if (status === 'disconnected') {
          lost = true
          if (reloadAfterMs !== undefined && !cancelReload)
            cancelReload = reloadWhenReachable({ delayMs: reloadAfterMs })
          return
        }
        cancelReload?.()
        cancelReload = null
        if (!lost) return
        lost = false
        void queryClient.invalidateQueries()
      },
    )

    return () => {
      cancelReload?.()
      unsubscribe()
    }
  }, [queryClient, reloadAfterMs])
}
