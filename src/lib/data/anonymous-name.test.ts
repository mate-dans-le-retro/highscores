import { describe, expect, it } from 'vitest'

import {
  FALLBACK_CHARACTERS,
  QUALIFIERS,
  TETRIS_CHARACTERS,
  anonymousName,
  hashSeed,
  normalizePlayerName,
} from './anonymous-name'

describe('normalizePlayerName', () => {
  it('lowercases, strips accents and collapses spaces', () => {
    expect(normalizePlayerName('  Zoé  Dupont ')).toBe('zoe dupont')
    expect(normalizePlayerName('Éléonore')).toBe('eleonore')
  })
})

describe('hashSeed', () => {
  it('is stable', () => {
    expect(hashSeed('zoe\0g-tetris')).toBe(hashSeed('zoe\0g-tetris'))
  })

  it('changes when the game changes', () => {
    expect(hashSeed('zoe\0g-tetris')).not.toBe(hashSeed('zoe\0g-duck-hunt'))
  })
})

describe('anonymousName', () => {
  it('keeps one nickname per player and game', () => {
    const first = anonymousName({ playerName: 'Zoé', gameId: 'g-tetris' })
    const again = anonymousName({ playerName: 'Zoé', gameId: 'g-tetris' })
    const otherGame = anonymousName({
      playerName: 'Zoé',
      gameId: 'g-duck-hunt',
    })
    expect(first).toBe(again)
    expect(first).not.toBe(otherGame)
  })

  it('ignores accents and spacing when seeding', () => {
    expect(anonymousName({ playerName: 'Zoé', gameId: 'g-tetris' })).toBe(
      anonymousName({ playerName: '  zoe ', gameId: 'g-tetris' }),
    )
  })

  it('starts with Un or Une and uses a known qualifier', () => {
    const name = anonymousName({ playerName: 'Marc', gameId: 'g-tetris' })
    expect(name).toMatch(/^Une? /)
    const body = name.replace(/^Une? /, '')
    const qualifier = QUALIFIERS.flatMap(({ m, f }) => [m, f]).find((word) =>
      body.includes(` ${word}`),
    )
    expect(qualifier).toBeDefined()
  })

  it('picks a character from the game list when provided', () => {
    const name = anonymousName({
      playerName: 'Zoé',
      gameId: 'g-custom',
      characters: TETRIS_CHARACTERS,
    })
    expect(
      TETRIS_CHARACTERS.some(({ name: character }) => name.includes(character)),
    ).toBe(true)
  })

  it('falls back to the pop-culture cast for an unknown game', () => {
    const name = anonymousName({
      playerName: 'Zoé',
      gameId: 'g-unknown-game',
    })
    expect(
      FALLBACK_CHARACTERS.some(({ name: character }) =>
        name.includes(character),
      ),
    ).toBe(true)
  })

  it('agrees the article with a feminine character', () => {
    const name = anonymousName({
      playerName: 'seed-f',
      gameId: 'g-test',
      characters: [{ name: 'Samus', gender: 'f' }],
    })
    expect(name.startsWith('Une Samus ')).toBe(true)
  })

  it('never emits a masculine-only ending for a feminine character', () => {
    const masculineOnly = [
      'masqué',
      'discret',
      'camouflé',
      'furtif',
      'silencieux',
      'inconnu',
      'clandestin',
      'voilé',
      'secret',
    ]
    for (let i = 0; i < 30; i++) {
      const name = anonymousName({
        playerName: `player-f-${i}`,
        gameId: 'g-test',
        characters: [{ name: 'Peach', gender: 'f' }],
      })
      expect(name.startsWith('Une Peach ')).toBe(true)
      for (const word of masculineOnly) {
        expect(name.split(' ')).not.toContain(word)
      }
    }
  })

  it('spreads players over several nicknames', () => {
    const names = new Set(
      Array.from({ length: 40 }, (_, i) =>
        anonymousName({ playerName: `player-${i}`, gameId: 'g-tetris' }),
      ),
    )
    expect(names.size).toBeGreaterThan(10)
  })
})
