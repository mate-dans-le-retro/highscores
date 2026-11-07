import { describe, expect, it } from 'vitest'

import { hasExclusiveGameChoice } from './submission-game'

describe('hasExclusiveGameChoice', () => {
  it('accepts a listed game with no custom name', () => {
    expect(hasExclusiveGameChoice('game-1', null)).toBe(true)
    expect(hasExclusiveGameChoice('game-1', undefined)).toBe(true)
    expect(hasExclusiveGameChoice('game-1', '')).toBe(true)
    expect(hasExclusiveGameChoice('game-1', '   ')).toBe(true)
  })

  it('accepts a custom name with no game id', () => {
    expect(hasExclusiveGameChoice(null, 'Bomberman')).toBe(true)
    expect(hasExclusiveGameChoice(undefined, 'Bomberman')).toBe(true)
    expect(hasExclusiveGameChoice('', 'Bomberman')).toBe(true)
  })

  it('rejects both missing', () => {
    expect(hasExclusiveGameChoice(null, null)).toBe(false)
    expect(hasExclusiveGameChoice(undefined, undefined)).toBe(false)
    expect(hasExclusiveGameChoice('', '')).toBe(false)
    expect(hasExclusiveGameChoice(null, '   ')).toBe(false)
  })

  it('rejects both set', () => {
    expect(hasExclusiveGameChoice('game-1', 'Bomberman')).toBe(false)
  })
})
