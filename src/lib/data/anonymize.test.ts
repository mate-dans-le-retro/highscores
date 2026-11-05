import { describe, expect, it } from 'vitest'

import { anonymousName } from './anonymous-name'
import { displayedPlayerName, toPublicRow } from './anonymize'

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

describe('a score sent without a name', () => {
  const nameless = { ...row, player_name: null }

  it('shows a nickname seeded by the score id, with its photo', () => {
    const publicRow = toPublicRow(nameless, true)
    expect(publicRow.anonymous).toBe(false)
    expect(publicRow.photo_path).toBe('submissions/zoe.jpg')
    expect(publicRow.player_name).toBe(
      anonymousName({ playerName: 's-42', gameId: 'g-tetris' }),
    )
  })

  it('treats a blank name as empty', () => {
    expect(toPublicRow({ ...row, player_name: '  ' }, true).player_name).toBe(
      toPublicRow(nameless, true).player_name,
    )
  })

  it('gets a nickname of its own, not the one of another nameless score', () => {
    const names = new Set(
      ['s-1', 's-2', 's-3', 's-4', 's-5'].map(
        (id) => toPublicRow({ ...nameless, id }, true).player_name,
      ),
    )
    expect(names.size).toBeGreaterThan(1)
  })

  it('stays anonymous and without photo when kept off screen', () => {
    const publicRow = toPublicRow(nameless, false)
    expect(publicRow.anonymous).toBe(true)
    expect(publicRow.photo_path).toBeNull()
    expect(publicRow.player_name).toBe(
      anonymousName({ playerName: 's-42', gameId: 'g-tetris' }),
    )
  })
})

describe('displayedPlayerName', () => {
  it('previews the name the screen will show', () => {
    const input = {
      scoreId: 'draft-1',
      displayOnScreen: true,
      gameId: 'g-tetris',
    }
    expect(displayedPlayerName({ ...input, playerName: ' Julie ' })).toBe(
      'Julie',
    )
    expect(displayedPlayerName({ ...input, playerName: '' })).toBe(
      toPublicRow({ ...row, id: 'draft-1', player_name: null }, true)
        .player_name,
    )
  })
})
