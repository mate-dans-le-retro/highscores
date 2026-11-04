import type { ScoreOrder } from '../types'

interface Rankable {
  score: number
  created_at: string
}

/**
 * Sorts by the game's score order and ranks like SQL rank(): equal scores
 * share the place and the next one skips (1, 1, 3). Ties keep the oldest first.
 */
export function rankScores<T extends Rankable>(
  scores: Array<T>,
  order: ScoreOrder,
): Array<{ entry: T; rank: number }> {
  const sign = order === 'desc' ? -1 : 1
  const sorted = [...scores].sort(
    (a, b) =>
      sign * (a.score - b.score) ||
      Date.parse(a.created_at) - Date.parse(b.created_at),
  )

  let rank = 0
  return sorted.map((entry, index) => {
    if (index === 0 || entry.score !== sorted[index - 1].score) rank = index + 1
    return { entry, rank }
  })
}
