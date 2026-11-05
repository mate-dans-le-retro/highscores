import type { GameRecord, NewRecord, ScoreOrder } from './types'

export function isBetter(score: number, than: number, order: ScoreOrder) {
  return order === 'desc' ? score > than : score < than
}

/**
 * Compares two snapshots of the records and returns the games whose first place
 * was just beaten. A first place that changes because a score was removed is
 * not a new record. A game missing from `before` (just shown) is ignored.
 */
export function findNewRecords(
  before: Array<GameRecord>,
  after: Array<GameRecord>,
): Array<NewRecord> {
  const beforeByGame = new Map(before.map((record) => [record.game.id, record]))

  return after.flatMap(({ game, current }) => {
    const previousRecords = beforeByGame.get(game.id)
    if (!previousRecords || !current) return []
    const previous = previousRecords.current
    if (current.id === previous?.id) return []
    if (previous && !isBetter(current.score, previous.score, game.score_order))
      return []
    // "RECORD ABSOLU" only when an existing record, from any event, is beaten.
    const bestEver = previousRecords.all_time
    const all_time =
      bestEver !== null &&
      isBetter(current.score, bestEver.score, game.score_order)
    return [{ game, record: current, previous, all_time }]
  })
}
