/**
 * A score approved while the screen runs stays highlighted this long, on
 * screen: the time under a "Nouveau record" takeover does not count.
 */
export const FRESH_MS = 30_000

/**
 * Only recent submissions count as fresh, so that an older score moving into
 * the visible rows (after a deletion, or more rows shown) is not highlighted.
 */
const RECENT_MS = 2 * 3_600_000

type ScoreLike = { id: string; created_at: string }

/**
 * Scores of one game that showed up since the screen last saw that game.
 * `seen` is undefined the first time: everything already on the board is
 * old news. Returns the ids to highlight and the updated set of seen ids.
 */
export function findFreshScores(
  seen: ReadonlySet<string> | undefined,
  rows: ReadonlyArray<ScoreLike>,
  now: number = Date.now(),
): { fresh: Array<string>; seen: Set<string> } {
  const next = new Set(seen)
  const fresh: Array<string> = []
  for (const row of rows) {
    if (seen && !seen.has(row.id)) {
      // A negative age is only clock drift between the screen and the server.
      const age = now - new Date(row.created_at).getTime()
      if (age < RECENT_MS) fresh.push(row.id)
    }
    next.add(row.id)
  }
  return { fresh, seen: next }
}
