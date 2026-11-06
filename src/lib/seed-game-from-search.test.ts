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

  it('leaves an already picked game alone', () => {
    const draft = { ...emptyScoreDraft(), gameId: 'g-tetris' }
    expect(seedGameFromSearch(draft, games, 'duck-hunt')).toBeNull()
  })

  it('leaves "Un autre jeu" alone', () => {
    const draft = { ...emptyScoreDraft(), customGame: true }
    expect(seedGameFromSearch(draft, games, 'duck-hunt')).toBeNull()
  })

  it('ignores an unknown slug', () => {
    expect(seedGameFromSearch(emptyScoreDraft(), games, 'missing')).toBeNull()
    expect(seedGameFromSearch(emptyScoreDraft(), games, undefined)).toBeNull()
  })
})
