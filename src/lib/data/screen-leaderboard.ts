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
 * - The top K of the all-time ranking fills the main block (past events
 *   dimmed, current-event rows at full brightness).
 * - Every current-event score outside that block goes under a separator, in
 *   ranking order: none is skipped while a lower one is shown.
 * - Each extra row shrinks the block (9+1, 8+2…), never below
 *   `minAllTimeRows`; when the extras outnumber the room left, the lowest
 *   ones are left out.
 * - Every row keeps its all-time rank, so the ranks only go down the screen.
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
  const m = Math.min(n, Math.max(1, minAllTimeRows))

  const ranked = rankScores(scores, order).map(({ entry, rank }) => ({
    ...entry,
    rank,
  }))
  const isCurrent = (row: ScoreForScreen) => row.event_id === currentEventId
  // Current-event scores below position k, i.e. outside a block of size k.
  const extrasBelow = (k: number) => ranked.slice(k).filter(isCurrent)

  // Shrinking the block pushes more current scores out of it, which may ask
  // for a smaller block again: settle on the largest block that leaves room
  // for its own extras. k only goes down, so this ends.
  let k = Math.min(n, ranked.length)
  for (;;) {
    const extras = extrasBelow(k).length
    if (k + extras <= n) break
    const next = Math.max(m, n - extras)
    if (next >= k) break
    k = next
  }

  const allTimeRows = ranked
    .slice(0, k)
    .map((row) => toScreenRow(row, 'all_time', currentEventId))
  const extraRows = extrasBelow(k)
    .slice(0, n - k)
    .map((row) => toScreenRow(row, 'current', currentEventId))

  return {
    rows: [...allTimeRows, ...extraRows],
    separator_at: extraRows.length > 0 ? allTimeRows.length : null,
    empty: false,
  }
}

function toScreenRow(
  row: ScoreForScreen,
  section: LeaderboardSection,
  currentEventId: string,
): ScreenLeaderboardRow {
  const { event_name, ...base } = row
  return {
    ...base,
    section,
    dimmed: section === 'all_time' && row.event_id !== currentEventId,
    event_name: event_name ?? null,
  }
}
