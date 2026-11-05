import { describe, expect, it } from 'vitest'

import { cn } from './utils'

describe('cn', () => {
  it('keeps a design-system size next to a colour', () => {
    expect(cn('text-body', 'text-ink-secondary')).toBe(
      'text-body text-ink-secondary',
    )
    expect(cn('font-display text-ink-secondary', 'text-arcade-title')).toBe(
      'font-display text-ink-secondary text-arcade-title',
    )
  })

  it('still lets a later size or colour win', () => {
    expect(cn('text-body', 'text-scene-meta')).toBe('text-scene-meta')
    expect(cn('text-ink-primary', 'text-ink-accent')).toBe('text-ink-accent')
  })
})
