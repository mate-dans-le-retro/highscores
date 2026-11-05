import { describe, expect, it } from 'vitest'

import {
  isValidInstagramHandle,
  normalizeInstagramHandle,
} from './instagram-handle'

describe('normalizeInstagramHandle', () => {
  it('strips a leading @ and surrounding spaces', () => {
    expect(normalizeInstagramHandle('  @Julie_42 ')).toBe('Julie_42')
  })

  it('returns null for an empty value', () => {
    expect(normalizeInstagramHandle('')).toBeNull()
    expect(normalizeInstagramHandle('   ')).toBeNull()
    expect(normalizeInstagramHandle('@')).toBeNull()
  })
})

describe('isValidInstagramHandle', () => {
  it('accepts an empty optional handle', () => {
    expect(isValidInstagramHandle('')).toBe(true)
    expect(isValidInstagramHandle('  @  ')).toBe(true)
  })

  it('accepts letters, digits, dots and underscores up to 30 chars', () => {
    expect(isValidInstagramHandle('@mate_dans_le_retro')).toBe(true)
    expect(isValidInstagramHandle('a.b_c1')).toBe(true)
    expect(isValidInstagramHandle('a'.repeat(30))).toBe(true)
  })

  it('rejects spaces, accents and overlong handles', () => {
    expect(isValidInstagramHandle('julie dupont')).toBe(false)
    expect(isValidInstagramHandle('@élodie')).toBe(false)
    expect(isValidInstagramHandle('bad!name')).toBe(false)
    expect(isValidInstagramHandle('a'.repeat(31))).toBe(false)
  })
})
