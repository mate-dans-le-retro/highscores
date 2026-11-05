import { describe, expect, it } from 'vitest'

import { findFreshScores } from './fresh-scores'

const now = new Date('2026-11-07T15:00:00+01:00').getTime()
const row = (id: string, minutesAgo: number) => ({
  id,
  created_at: new Date(now - minutesAgo * 60_000).toISOString(),
})

describe('findFreshScores', () => {
  it('highlights nothing the first time a game shows', () => {
    const { fresh, seen } = findFreshScores(undefined, [row('a', 5)], now)
    expect(fresh).toEqual([])
    expect([...seen]).toEqual(['a'])
  })

  it('highlights a recent score that was not on the board before', () => {
    const first = findFreshScores(undefined, [row('a', 30)], now)
    const second = findFreshScores(first.seen, [row('b', 3), row('a', 30)], now)
    expect(second.fresh).toEqual(['b'])
    expect([...second.seen].sort()).toEqual(['a', 'b'])
  })

  it('ignores an old score that moves into view', () => {
    const first = findFreshScores(undefined, [row('a', 30)], now)
    const second = findFreshScores(
      first.seen,
      [row('a', 30), row('z', 600)],
      now,
    )
    expect(second.fresh).toEqual([])
  })

  it('highlights a score only once', () => {
    const first = findFreshScores(undefined, [], now)
    const second = findFreshScores(first.seen, [row('b', 1)], now)
    const third = findFreshScores(second.seen, [row('b', 1)], now)
    expect(second.fresh).toEqual(['b'])
    expect(third.fresh).toEqual([])
  })
})
