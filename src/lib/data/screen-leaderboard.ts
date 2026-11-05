import { rankScores } from './ranking'
import type { LeaderboardRow, ScoreOrder } from './types'

export type LeaderboardSection = 'all_time' | 'current'

/** One row of the projected screen, already split between the two blocks. */
export interface ScreenLeaderboardRow extends LeaderboardRow {
  section: LeaderboardSection
  /** Past-event rows in the all-time block are dimmed in the UI. */
  dimmed: boolean
  event_name: string | null
}

export interface ScreenLeaderboard {
  /** All-time block, then current-event extras under the separator. */
  rows: Array<ScreenLeaderboardRow>
  /** Index of the first current-extra row, or null when there is no separator. */
  separator_at: number | null
  empty: boolean
}

export interface ScreenLeaderboardOptions {
  /** N: total slots on screen (`rows_shown`). */
  rowsShown: number
  /** M: all-time block never shrinks below this (`min_all_time_rows`). */
  minAllTimeRows: number
  currentEventId: string
}

export interface ScoreForScreen extends LeaderboardRow {
  event_name: string | null
}

/**
 * Builds the public-screen leaderboard from every approved score of a game.
 *
 * - Top of the all-time ranking fills the main block (past events dimmed).
 * - Current-event scores outside that top go under a separator, without
 *   duplicates.
 * - Each extra current row shrinks the all-time block (9+1, 8+2…), but never
 *   below `minAllTimeRows`.
 */
export function buildScreenLeaderboard(
  scores: Array<ScoreForScreen>,
  order: ScoreOrder,
  { rowsShown, minAllTimeRows, currentEventId }: ScreenLeaderboardOptions,
): ScreenLeaderboard {
  if (scores.length === 0) {
    return { rows: [], separator_at: null, empty: true }
  }

  const n = Math.max(1, rowsShown)
  const m = Math.min(n, Math.max(0, minAllTimeRows))

  const allTimeRanked = rankScores(scores, order).map(({ entry, rank }) => ({
    ...entry,
    rank,
  }))

  const currentOnly = allTimeRanked.filter(
    (row) => row.event_id === currentEventId,
  )
  const currentRankById = new Map(
    rankScores(currentOnly, order).map(({ entry, rank }) => [entry.id, rank]),
  )

  // Provisional all-time top of size N: anything from the current event in
  // there stays in the main block (full brightness), never under the separator.
  const provisionalTop = allTimeRanked.slice(0, n)
  const topIds = new Set(provisionalTop.map((row) => row.id))

  const extrasAll = allTimeRanked.filter(
    (row) => row.event_id === currentEventId && !topIds.has(row.id),
  )

  const extrasCount = Math.min(extrasAll.length, n - m)
  const allTimeCount = n - extrasCount
  const allTimeRows = provisionalTop
    .slice(0, allTimeCount)
    .map((row) => toScreenRow(row, 'all_time', currentEventId, row.rank))
  const extraRows = extrasAll
    .slice(0, extrasCount)
    .map((row) =>
      toScreenRow(
        row,
        'current',
        currentEventId,
        currentRankById.get(row.id) ?? row.rank,
      ),
    )

  const rows = [...allTimeRows, ...extraRows]
  return {
    rows,
    separator_at: extraRows.length > 0 ? allTimeRows.length : null,
    empty: rows.length === 0,
  }
}

function toScreenRow(
  row: ScoreForScreen,
  section: LeaderboardSection,
  currentEventId: string,
  rank: number,
): ScreenLeaderboardRow {
  const { event_name, ...base } = row
  return {
    ...base,
    rank,
    section,
    dimmed: section === 'all_time' && row.event_id !== currentEventId,
    event_name: event_name ?? null,
  }
}
