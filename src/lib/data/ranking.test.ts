import { describe, expect, it } from 'vitest'

import { rankScores } from './ranking'

const entry = (id: string, score: number, minute = 0) => ({
  id,
  score,
  created_at: `2026-11-07T10:${String(minute).padStart(2, '0')}:00Z`,
})

const summary = (
  ranked: ReturnType<typeof rankScores<ReturnType<typeof entry>>>,
) => ranked.map(({ entry: { id }, rank }) => `${rank}:${id}`)

describe('rankScores', () => {
  it('puts the highest score first for a desc game', () => {
    const ranked = rankScores(
      [entry('a', 10), entry('b', 30), entry('c', 20)],
      'desc',
    )
    expect(summary(ranked)).toEqual(['1:b', '2:c', '3:a'])
  })

  it('puts the lowest score first for an asc game (times)', () => {
    const ranked = rankScores([entry('a', 95_100), entry('b', 92_480)], 'asc')
    expect(summary(ranked)).toEqual(['1:b', '2:a'])
  })

  it('shares the place on a tie and skips the next one, like SQL rank()', () => {
    const ranked = rankScores(
      [entry('a', 100), entry('b', 100), entry('c', 50), entry('d', 200)],
      'desc',
    )
    expect(summary(ranked)).toEqual(['1:d', '2:a', '2:b', '4:c'])
  })

  it('lists the oldest score first within a tie', () => {
    const ranked = rankScores(
      [entry('late', 100, 30), entry('early', 100, 5)],
      'desc',
    )
    expect(summary(ranked)).toEqual(['1:early', '1:late'])
  })

  it('does not reorder the array it receives', () => {
    const scores = [entry('a', 10), entry('b', 30)]
    rankScores(scores, 'desc')
    expect(scores.map(({ id }) => id)).toEqual(['a', 'b'])
  })
})
