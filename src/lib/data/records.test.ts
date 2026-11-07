import { describe, expect, it } from 'vitest'

import { findNewRecords, keepNewestCelebration } from './records'
import type {
  DisplayedGame,
  GameRecord,
  LeaderboardRow,
  NewRecord,
} from './types'

const game = (
  id: string,
  score_order: 'desc' | 'asc' = 'desc',
): DisplayedGame => ({
  id,
  slug: id,
  name: id,
  short_label: id.slice(0, 3).toUpperCase(),
  console: null,
  score_type: score_order === 'asc' ? 'time' : 'points',
  score_order,
  score_unit: null,
  visible: true,
  position: 1,
  cover_path: null,
  station_label: null,
})

const row = (id: string, gameId: string, score: number): LeaderboardRow => ({
  id,
  game_id: gameId,
  event_id: 'evt',
  player_name: id,
  score,
  photo_path: null,
  anonymous: false,
  created_at: '2026-11-07T10:00:00Z',
  rank: 1,
})

const record = (
  g: DisplayedGame,
  current: LeaderboardRow | null,
  allTime: LeaderboardRow | null = current,
): GameRecord => ({
  game: g,
  current,
  runner_up: null,
  all_time: allTime && { ...allTime, event_name: null, station_label: null },
})

const tetris = game('tetris')
const kart = game('kart', 'asc')

describe('findNewRecords', () => {
  it('detects a first place that was just beaten', () => {
    const marc = row('marc', 'tetris', 98_200)
    const julie = row('julie', 'tetris', 128_400)
    const found = findNewRecords(
      [record(tetris, marc)],
      [record(tetris, julie)],
    )
    expect(found).toEqual([
      { game: tetris, record: julie, previous: marc, all_time: true },
    ])
  })

  it('tells when the record is not the best ever', () => {
    const lea = row('lea', 'duck', 20_000)
    const leaBetter = row('lea2', 'duck', 24_500)
    const marcApril = row('marc', 'duck', 31_200)
    const duck = game('duck')
    const [found] = findNewRecords(
      [record(duck, lea, marcApril)],
      [record(duck, leaBetter, marcApril)],
    )
    expect(found.all_time).toBe(false)
  })

  it('follows the score order of the game', () => {
    const yanis = row('yanis', 'kart', 92_480)
    const faster = row('lina', 'kart', 90_000)
    const slower = row('tom', 'kart', 95_000)
    expect(
      findNewRecords([record(kart, yanis)], [record(kart, faster)]),
    ).toHaveLength(1)
    expect(
      findNewRecords([record(kart, yanis)], [record(kart, slower)]),
    ).toEqual([])
  })

  it('ignores a first place that changes because a score was removed', () => {
    const julie = row('julie', 'tetris', 128_400)
    const marc = row('marc', 'tetris', 98_200)
    expect(
      findNewRecords([record(tetris, julie)], [record(tetris, marc)]),
    ).toEqual([])
  })

  it('ignores a tie with the current record', () => {
    const julie = row('julie', 'tetris', 128_400)
    const tie = row('sam', 'tetris', 128_400)
    expect(
      findNewRecords([record(tetris, julie)], [record(tetris, tie)]),
    ).toEqual([])
  })

  it('counts the first score of a game as a record, without the all-time badge', () => {
    const first = row('paul', 'tetris', 10)
    const [found] = findNewRecords(
      [record(tetris, null)],
      [record(tetris, first)],
    )
    expect(found.previous).toBeNull()
    expect(found.all_time).toBe(false)
  })

  it('gives the all-time badge when a past event record is beaten', () => {
    const lea = row('lea', 'duck', 24_500)
    const marcApril = row('marc', 'duck', 31_200)
    const hugo = row('hugo', 'duck', 35_000)
    const duck = game('duck')
    const [found] = findNewRecords(
      [record(duck, lea, marcApril)],
      [record(duck, hugo, hugo)],
    )
    expect(found.all_time).toBe(true)
  })

  it('does not give the all-time badge for a tie with the best ever', () => {
    const lea = row('lea', 'duck', 24_500)
    const marcApril = row('marc', 'duck', 31_200)
    const tie = row('tom', 'duck', 31_200)
    const duck = game('duck')
    const [found] = findNewRecords(
      [record(duck, lea, marcApril)],
      [record(duck, tie, marcApril)],
    )
    expect(found.all_time).toBe(false)
  })

  it('gives the all-time badge to a faster time on an asc game', () => {
    const yanis = row('yanis', 'kart', 92_480)
    const lina = row('lina', 'kart', 90_000)
    const [found] = findNewRecords([record(kart, yanis)], [record(kart, lina)])
    expect(found.all_time).toBe(true)
  })

  it('ignores a game that was not shown before', () => {
    const julie = row('julie', 'tetris', 128_400)
    expect(findNewRecords([], [record(tetris, julie)])).toEqual([])
  })

  it('finds nothing when nothing changed', () => {
    const julie = row('julie', 'tetris', 128_400)
    expect(
      findNewRecords([record(tetris, julie)], [record(tetris, julie)]),
    ).toEqual([])
  })
})

describe('keepNewestCelebration', () => {
  const celebration = (
    gameId: string,
    scoreId: string,
    created_at: string,
  ): NewRecord => {
    const g = game(gameId)
    const current = { ...row(scoreId, gameId, 100), created_at }
    return {
      game: g,
      record: current,
      previous: null,
      all_time: false,
    }
  }

  it('leaves the queue alone when nothing new was found', () => {
    const queued = celebration('tetris', 'a', '2026-11-07T10:00:00Z')
    expect(keepNewestCelebration([queued], [])).toEqual([queued])
  })

  it('keeps only the newest across the queue and the new finds', () => {
    const older = celebration('tetris', 'a', '2026-11-07T10:00:00Z')
    const mid = celebration('kart', 'b', '2026-11-07T11:00:00Z')
    const newest = celebration('pong', 'c', '2026-11-07T12:00:00Z')
    expect(keepNewestCelebration([older], [mid, newest])).toEqual([newest])
  })
})
