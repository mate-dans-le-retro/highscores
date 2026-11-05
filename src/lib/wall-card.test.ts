import { describe, expect, it } from 'vitest'

import type {
  AllTimeRecord,
  DisplayedGame,
  GameRecord,
  LeaderboardRow,
} from './data/types'
import { wallCardView } from './wall-card'

const game = { id: 'g-guitar-hero', name: 'Guitar Hero' } as DisplayedGame

const row = (id: string, score: number, event_id: string): LeaderboardRow => ({
  id,
  game_id: game.id,
  event_id,
  player_name: id,
  score,
  photo_path: null,
  anonymous: false,
  created_at: '2026-04-11T15:00:00Z',
  rank: 1,
})

const allTime = (entry: LeaderboardRow, event_name: string): AllTimeRecord => ({
  ...entry,
  event_name,
  station_label: null,
})

const record = (
  current: LeaderboardRow | null,
  all_time: AllTimeRecord | null,
): GameRecord => ({ game, current, runner_up: null, all_time })

describe('wallCardView', () => {
  it('stars an event record that is also the all-time record, without ★ line', () => {
    const julie = row('julie', 128_400, 'evt-2026-11')
    const view = wallCardView(record(julie, allTime(julie, 'Novembre 2026')))
    expect(view).toEqual({
      kind: 'record',
      main: julie,
      allTimeStar: true,
      otherAllTime: null,
      origin: null,
    })
  })

  it('shows the all-time record on a ★ line when it is another score', () => {
    const hugo = row('hugo', 480_000, 'evt-2026-11')
    const alex = allTime(row('alex', 520_000, 'evt-2025-11'), 'Novembre 2025')
    const view = wallCardView(record(hugo, alex))
    expect(view).toMatchObject({
      main: hugo,
      allTimeStar: false,
      otherAllTime: alex,
      origin: null,
    })
  })

  it('falls back to the starred all-time record, with its event and date', () => {
    const marc = allTime(
      row('marc', 31_200, 'evt-2026-04'),
      "Weekend d'avril 2026",
    )
    const view = wallCardView(record(null, marc))
    expect(view).toMatchObject({
      main: marc,
      allTimeStar: true,
      otherAllTime: null,
      origin: {
        event_name: "Weekend d'avril 2026",
        created_at: '2026-04-11T15:00:00Z',
      },
    })
  })

  it('is empty when the game has no score at all', () => {
    expect(wallCardView(record(null, null))).toEqual({ kind: 'empty' })
  })
})
