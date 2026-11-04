import { describe, expect, it } from 'vitest'

import { DEFAULT_SETTINGS } from './data/source'
import { screenOptions, screenSearchSchema } from './screen-options'

const parse = (search: Record<string, unknown>) =>
  screenSearchSchema.parse(search)

describe('screenSearchSchema', () => {
  it('reads whole numbers, from the URL or already parsed', () => {
    expect(parse({ rotation: '30', rows: 10 })).toEqual({
      rotation: 30,
      rows: 10,
    })
  })

  it('clamps values out of bounds', () => {
    expect(parse({ rotation: 1, rows: 50 })).toEqual({ rotation: 5, rows: 10 })
    expect(parse({ rotation: 9999, rows: 0 })).toEqual({
      rotation: 300,
      rows: 1,
    })
  })

  it('ignores missing or invalid values', () => {
    expect(parse({})).toEqual({})
    expect(parse({ rotation: 'vite', rows: 2.5 })).toEqual({
      rotation: undefined,
      rows: undefined,
    })
  })
})

describe('screenOptions', () => {
  it('uses the settings by default: 15 s and 5 rows', () => {
    expect(screenOptions(DEFAULT_SETTINGS, {})).toEqual({
      rotationMs: 15_000,
      rows: 5,
    })
  })

  it('lets the URL override the settings', () => {
    expect(screenOptions(DEFAULT_SETTINGS, { rotation: 30, rows: 10 })).toEqual(
      {
        rotationMs: 30_000,
        rows: 10,
      },
    )
  })

  it('follows settings changed in the admin', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      game_duration_s: 60,
      rows_shown: 3,
    } as const
    expect(screenOptions(settings, {})).toEqual({ rotationMs: 60_000, rows: 3 })
  })
})
