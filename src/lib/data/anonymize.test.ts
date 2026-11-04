import { describe, expect, it } from 'vitest'

import { ANONYMOUS_NAMES, anonymousName, toPublicRow } from './anonymize'

const row = {
  id: 's-42',
  game_id: 'g-tetris',
  event_id: 'evt-2026-11',
  player_name: 'Zoé',
  score: 41_000,
  photo_path: 'submissions/zoe.jpg',
  created_at: '2026-11-07T10:00:00Z',
  rank: 6,
}

describe('toPublicRow', () => {
  it('keeps a displayed score as is', () => {
    expect(toPublicRow(row, true)).toEqual({ ...row, anonymous: false })
  })

  it('never lets the name or the photo of an anonymous score through', () => {
    const publicRow = toPublicRow(row, false)
    expect(publicRow.anonymous).toBe(true)
    expect(publicRow.photo_path).toBeNull()
    expect(ANONYMOUS_NAMES).toContain(publicRow.player_name)
    expect(JSON.stringify(publicRow)).not.toContain('Zoé')
    expect(JSON.stringify(publicRow)).not.toContain('zoe.jpg')
  })

  it('keeps the anonymous score ranked', () => {
    const publicRow = toPublicRow(row, false)
    expect(publicRow.score).toBe(41_000)
    expect(publicRow.rank).toBe(6)
  })
})

describe('anonymousName', () => {
  it('always gives the same nickname to the same score', () => {
    expect(anonymousName('s-42')).toBe(anonymousName('s-42'))
  })

  it('spreads scores over several nicknames', () => {
    const names = new Set(
      Array.from({ length: 50 }, (_, i) => anonymousName(`s-${i}`)),
    )
    expect(names.size).toBeGreaterThan(1)
  })
})
