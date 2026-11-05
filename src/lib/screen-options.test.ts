import { describe, expect, it } from 'vitest'

import { DEFAULT_SETTINGS } from './data/source'
import { screenOptions, screenSearchSchema } from './screen-options'

const parse = (search: Record<string, unknown>) =>
  screenSearchSchema.parse(search)

describe('screenSearchSchema', () => {
  it('reads whole numbers, from the URL or already parsed', () => {
    expect(parse({ rotation: '30', rows: 10, minAllTime: 5 })).toEqual({
      rotation: 30,
      rows: 10,
      minAllTime: 5,
    })
  })

  it('clamps values out of bounds', () => {
    expect(parse({ rotation: 1, rows: 50, minAllTime: 0 })).toEqual({
      rotation: 5,
      rows: 10,
      minAllTime: 1,
    })
    expect(parse({ rotation: 9999, rows: 0, minAllTime: 99 })).toEqual({
      rotation: 300,
      rows: 1,
      minAllTime: 10,
    })
  })

  it('reads the header override', () => {
    expect(parse({ header: 1 }).header).toBe(1)
    expect(parse({ header: '0' }).header).toBe(0)
    expect(parse({ header: 'oui' }).header).toBeUndefined()
    expect(screenOptions(DEFAULT_SETTINGS, {}).showHeader).toBe(false)
    expect(screenOptions(DEFAULT_SETTINGS, { header: 1 }).showHeader).toBe(true)
    expect(
      screenOptions({ ...DEFAULT_SETTINGS, show_header: true }, { header: 0 })
        .showHeader,
    ).toBe(false)
  })

  it('ignores missing or invalid values', () => {
    expect(parse({})).toEqual({})
    expect(parse({ rotation: 'vite', rows: 2.5, minAllTime: 'nope' })).toEqual({
      rotation: undefined,
      rows: undefined,
      minAllTime: undefined,
    })
  })
})

describe('screenOptions', () => {
  it('uses the settings by default: 15 s game, 20 s wall, 10 rows, 5 all-time min', () => {
    expect(screenOptions(DEFAULT_SETTINGS, {})).toEqual({
      rotationMs: 15_000,
      gameDurationMs: 15_000,
      wallDurationMs: 20_000,
      screenMode: 'game',
      rows: 10,
      minAllTimeRows: 5,
      showHeader: false,
    })
  })

  it('lets the URL override the settings', () => {
    expect(
      screenOptions(DEFAULT_SETTINGS, {
        rotation: 30,
        rows: 8,
        minAllTime: 3,
      }),
    ).toEqual({
      rotationMs: 30_000,
      gameDurationMs: 30_000,
      wallDurationMs: 30_000,
      screenMode: 'game',
      rows: 8,
      minAllTimeRows: 3,
      showHeader: false,
    })
  })

  it('never lets minAllTime exceed the row count', () => {
    expect(
      screenOptions(DEFAULT_SETTINGS, { rows: 3, minAllTime: 10 }),
    ).toEqual({
      rotationMs: 15_000,
      gameDurationMs: 15_000,
      wallDurationMs: 20_000,
      screenMode: 'game',
      rows: 3,
      minAllTimeRows: 3,
      showHeader: false,
    })
  })

  it('follows settings changed in the admin', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      screen_mode: 'both',
      game_duration_s: 60,
      wall_duration_s: 30,
      rows_shown: 3,
      min_all_time_rows: 3,
    } as const
    expect(screenOptions(settings, {})).toEqual({
      rotationMs: 60_000,
      gameDurationMs: 60_000,
      wallDurationMs: 30_000,
      screenMode: 'both',
      rows: 3,
      minAllTimeRows: 3,
      showHeader: false,
    })
  })
})
