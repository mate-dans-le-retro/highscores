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

  return after.flatMap(({ game, current, all_time }) => {
    const previousRecord = beforeByGame.get(game.id)
    if (!previousRecord || !current) return []
    const previous = previousRecord.current
    if (current.id === previous?.id) return []
    if (previous && !isBetter(current.score, previous.score, game.score_order))
      return []
    return [
      {
        game,
        record: current,
        previous,
        all_time: all_time?.id === current.id,
      },
    ]
  })
}
