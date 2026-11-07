import { describe, expect, it } from 'vitest'

import { emptyScoreDraft } from './score-draft'
import { seedGameFromSearch } from './seed-game-from-search'

const games = [
  { id: 'g-duck', slug: 'duck-hunt' },
  { id: 'g-tetris', slug: 'tetris' },
]

describe('seedGameFromSearch', () => {
  it('picks the slug when the draft has no game yet', () => {
    const next = seedGameFromSearch(emptyScoreDraft(), games, 'duck-hunt')
    expect(next?.gameId).toBe('g-duck')
    expect(next?.customGame).toBe(false)
  })

  it('overrides an already picked game when the QR slug differs', () => {
    const draft = { ...emptyScoreDraft(), gameId: 'g-tetris' }
    const next = seedGameFromSearch(draft, games, 'duck-hunt')
    expect(next?.gameId).toBe('g-duck')
    expect(next?.customGame).toBe(false)
  })

  it('overrides "Un autre jeu" when a visible QR slug is present', () => {
    const draft = {
      ...emptyScoreDraft(),
      customGame: true,
      customGameName: 'Pong',
    }
    const next = seedGameFromSearch(draft, games, 'duck-hunt')
    expect(next?.gameId).toBe('g-duck')
    expect(next?.customGame).toBe(false)
    expect(next?.customGameName).toBeNull()
  })

  it('leaves the draft alone when the slug already matches', () => {
    const draft = { ...emptyScoreDraft(), gameId: 'g-duck' }
    expect(seedGameFromSearch(draft, games, 'duck-hunt')).toBeNull()
  })

  it('ignores an unknown slug', () => {
    expect(seedGameFromSearch(emptyScoreDraft(), games, 'missing')).toBeNull()
    expect(seedGameFromSearch(emptyScoreDraft(), games, undefined)).toBeNull()
  })
})
