import { describe, expect, it } from 'vitest'

import { anonymousName } from './anonymous-name'
import { toPublicRow } from './anonymize'

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
    expect(publicRow.player_name).toBe(
      anonymousName({ playerName: 'Zoé', gameId: 'g-tetris' }),
    )
    expect(JSON.stringify(publicRow)).not.toContain('Zoé')
    expect(JSON.stringify(publicRow)).not.toContain('zoe.jpg')
  })

  it('keeps the anonymous score ranked', () => {
    const publicRow = toPublicRow(row, false)
    expect(publicRow.score).toBe(41_000)
    expect(publicRow.rank).toBe(6)
  })

  it('keeps the same nickname for the same player on the same game', () => {
    const first = toPublicRow(row, false)
    const second = toPublicRow({ ...row, id: 's-99', score: 12_000 }, false)
    expect(first.player_name).toBe(second.player_name)
  })
})
