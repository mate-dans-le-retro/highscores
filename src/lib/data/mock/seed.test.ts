import { describe, expect, it } from 'vitest'

import { buildSeedScores, seedSettings } from './seed'

const NOW = new Date('2026-11-07T16:00:00Z').getTime()
const HOUR = 3_600_000

describe('mock seed', () => {
  it('dates the current event from now, never in the future', () => {
    const current = buildSeedScores(NOW).filter(
      (score) => score.event_id === 'evt-2026-11',
    )
    const ages = current.map(
      (score) => NOW - new Date(score.created_at).getTime(),
    )
    expect(ages.every((age) => age >= 0)).toBe(true)
    expect(ages.filter((age) => age < HOUR).length).toBeGreaterThanOrEqual(5)
    expect(
      ages.filter((age) => age >= HOUR && age < 8 * HOUR).length,
    ).toBeGreaterThanOrEqual(5)
    expect(ages.some((age) => age >= 24 * HOUR)).toBe(true)
  })

  it('keeps fixed dates for past events', () => {
    const april = buildSeedScores(NOW).find(
      (score) => score.player_name === 'Karim',
    )
    expect(april?.created_at).toBe('2026-04-11T16:20:00Z')
  })

  it('puts the records wall in the default rotation', () => {
    expect(seedSettings.screen_mode).toBe('both')
  })
})
