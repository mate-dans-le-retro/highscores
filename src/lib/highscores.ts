import { queryOptions, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { isMock, source } from './data'
import { mockTools } from './data/mock/mock-source'
import type { ConnectionStatus } from './data/realtime-connection'
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
export { displayedPlayerName } from './data/anonymize'
export { findNewRecords, keepNewestCelebration } from './data/records'
export { DEFAULT_SETTINGS } from './data/source'
export {
  formatScore,
  formatScoreWhen,
  formatStation,
  pixelCaps,
  splitGameTitle,
} from './format'
export { isMock }
export type { MockPendingScore } from './data/mock/mock-source'
export { mockTools }
export type { ConnectionStatus }
export { REALTIME_FRESHNESS_MS } from './data/realtime-connection'

/** Admin: warn once after this long disconnected; keep polling forever. */
export const ADMIN_WARN_AFTER_MS = 60_000

/** Poll while realtime is reconnecting (public + admin fallback). */
export const REALTIME_POLL_MS = 10_000

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
  games: ['games', 'leaderboard', 'records', 'pending', 'admin'],
  scores: ['leaderboard', 'records', 'pending', 'admin'],
  settings: ['settings', 'admin'],
}

export type HighscoresRealtimeOptions = {
  /**
   * Optional hard reload after this long disconnected. Unused on the public
   * screen: the 10 s poll already refreshes data while Realtime is down.
   */
  reloadAfterMs?: number
  /** Admin: fire once after this long disconnected; keep trying forever. */
  warnAfterMs?: number
  onDisconnectedTooLong?: () => void
}

/**
 * Refreshes the queries as soon as a score, a game or a setting changes.
 * On disconnect: keepSubscribed reconnects; callers should poll meanwhile.
 * On reconnect: refetch once to catch events missed while down.
 * Optional hard reload after `reloadAfterMs` (kept for callers that want it;
 * the public projector does not — poll covers a Realtime-only outage).
 * Admin: optional one-shot warn after `warnAfterMs` (no reload).
 */
export function useHighscoresRealtime(
  options: HighscoresRealtimeOptions = {},
): ConnectionStatus {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const { reloadAfterMs, warnAfterMs, onDisconnectedTooLong } = options

  useEffect(() => {
    let lost = false
    let cancelReload: (() => void) | null = null
    let warnTimer: ReturnType<typeof setTimeout> | null = null
    let warned = false

    const clearWarn = () => {
      if (warnTimer !== null) {
        clearTimeout(warnTimer)
        warnTimer = null
      }
    }

    const unsubscribe = source.subscribe(
      (table) => {
        for (const key of invalidatedBy[table])
          void queryClient.invalidateQueries({ queryKey: [key] })
      },
      (next) => {
        setStatus(next)
        if (next === 'disconnected') {
          lost = true
          if (reloadAfterMs !== undefined && !cancelReload) {
            cancelReload = reloadWhenReachable({ delayMs: reloadAfterMs })
          }
          if (
            warnAfterMs !== undefined &&
            onDisconnectedTooLong &&
            !warned &&
            warnTimer === null
          ) {
            warnTimer = setTimeout(() => {
              warned = true
              warnTimer = null
              onDisconnectedTooLong()
            }, warnAfterMs)
          }
          return
        }
        cancelReload?.()
        cancelReload = null
        clearWarn()
        if (!lost) return
        lost = false
        void queryClient.invalidateQueries()
      },
    )

    return () => {
      cancelReload?.()
      clearWarn()
      unsubscribe()
    }
  }, [queryClient, reloadAfterMs, warnAfterMs, onDisconnectedTooLong])

  return status
}

/**
 * Poll while realtime is down; stop when connected (change_signals cover it).
 */
export function realtimeFallbackInterval(
  status: ConnectionStatus,
  pollMs = REALTIME_POLL_MS,
): number | false {
  return status === 'connected' ? false : pollMs
}
