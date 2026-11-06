import { describe, expect, it } from 'vitest'

import {
  REALTIME_POLL_MS,
  realtimeFallbackInterval,
} from './highscores'

describe('realtimeFallbackInterval', () => {
  it('polls every 10 s while disconnected', () => {
    expect(realtimeFallbackInterval('disconnected')).toBe(REALTIME_POLL_MS)
    expect(REALTIME_POLL_MS).toBe(10_000)
  })

  it('stops polling once connected', () => {
    expect(realtimeFallbackInterval('connected')).toBe(false)
  })

  it('accepts a custom poll interval', () => {
    expect(realtimeFallbackInterval('disconnected', 5_000)).toBe(5_000)
  })
})
