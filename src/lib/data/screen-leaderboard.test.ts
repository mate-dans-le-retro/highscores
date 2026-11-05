import { describe, expect, it } from 'vitest'

import { buildScreenLeaderboard } from './screen-leaderboard'
import type { ScoreForScreen } from './screen-leaderboard'

const row = (
  id: string,
  score: number,
  event_id: string,
  event_name: string,
): ScoreForScreen => ({
  id,
  game_id: 'g-tetris',
  event_id,
  player_name: id,
  score,
  photo_path: null,
  anonymous: false,
  created_at: '2026-11-07T10:00:00Z',
  rank: 0,
  event_name,
})

const CURRENT = 'evt-2026-11'
const PAST = 'evt-2026-04'

describe('buildScreenLeaderboard', () => {
  it('returns the empty state when there is no score', () => {
    expect(
      buildScreenLeaderboard([], 'desc', {
        rowsShown: 10,
        minAllTimeRows: 5,
        currentEventId: CURRENT,
      }),
    ).toEqual({ rows: [], separator_at: null, empty: true })
  })

  it('fills the all-time block up to N when every score fits', () => {
    const scores = [
      row('julie', 128_400, CURRENT, 'Novembre 2026'),
      row('marc-past', 98_200, PAST, "Weekend d'avril 2026"),
      row('sam', 87_650, CURRENT, 'Novembre 2026'),
    ]
    const board = buildScreenLeaderboard(scores, 'desc', {
      rowsShown: 10,
      minAllTimeRows: 5,
      currentEventId: CURRENT,
    })
    expect(board.empty).toBe(false)
    expect(board.separator_at).toBeNull()
    expect(board.rows).toHaveLength(3)
    expect(
      board.rows.map(({ id, dimmed, section }) => [id, dimmed, section]),
    ).toEqual([
      ['julie', false, 'all_time'],
      ['marc-past', true, 'all_time'],
      ['sam', false, 'all_time'],
    ])
  })

  it('puts current-event scores outside the top under a separator', () => {
    // N=5: all-time top is a,b,c,d,e. Current extras f,g shrink the block.
    const scores = [
      row('a', 100, PAST, 'Past'),
      row('b', 90, PAST, 'Past'),
      row('c', 80, PAST, 'Past'),
      row('d', 70, PAST, 'Past'),
      row('e', 60, PAST, 'Past'),
      row('f', 50, CURRENT, 'Now'),
      row('g', 40, CURRENT, 'Now'),
    ]
    const board = buildScreenLeaderboard(scores, 'desc', {
      rowsShown: 5,
      minAllTimeRows: 3,
      currentEventId: CURRENT,
    })
    // 2 extras → all-time shrinks to 3 (5-2), never below M=3.
    expect(board.rows.map(({ id, section }) => `${section}:${id}`)).toEqual([
      'all_time:a',
      'all_time:b',
      'all_time:c',
      'current:f',
      'current:g',
    ])
    expect(board.separator_at).toBe(3)
    expect(
      board.rows.filter((r) => r.section === 'all_time').every((r) => r.dimmed),
    ).toBe(true)
  })

  it('never shrinks the all-time block below M', () => {
    const scores = [
      ...Array.from({ length: 8 }, (_, i) =>
        row(`past-${i}`, 200 - i, PAST, 'Past'),
      ),
      ...Array.from({ length: 8 }, (_, i) =>
        row(`now-${i}`, 50 - i, CURRENT, 'Now'),
      ),
    ]
    const board = buildScreenLeaderboard(scores, 'desc', {
      rowsShown: 10,
      minAllTimeRows: 5,
      currentEventId: CURRENT,
    })
    const allTime = board.rows.filter((r) => r.section === 'all_time')
    const extras = board.rows.filter((r) => r.section === 'current')
    expect(allTime).toHaveLength(5)
    expect(extras).toHaveLength(5)
    expect(board.rows).toHaveLength(10)
  })

  it('does not duplicate a current-event row already in the all-time top', () => {
    const scores = [
      row('julie', 128_400, CURRENT, 'Now'),
      row('marc', 98_200, PAST, 'Past'),
      row('sam', 40_000, CURRENT, 'Now'),
    ]
    const board = buildScreenLeaderboard(scores, 'desc', {
      rowsShown: 2,
      minAllTimeRows: 1,
      currentEventId: CURRENT,
    })
    // Provisional top N=2: julie, marc. sam is the only extra → all-time keeps 1.
    expect(board.rows.map(({ id }) => id)).toEqual(['julie', 'sam'])
    expect(board.rows[0]?.dimmed).toBe(false)
    expect(board.rows[1]?.section).toBe('current')
  })

  it('keeps all-time ranks in the main block and current ranks under the separator', () => {
    const scores = [
      row('a', 100, PAST, 'Past'),
      row('b', 90, CURRENT, 'Now'),
      row('c', 80, PAST, 'Past'),
      row('d', 70, CURRENT, 'Now'),
    ]
    const board = buildScreenLeaderboard(scores, 'desc', {
      rowsShown: 3,
      minAllTimeRows: 2,
      currentEventId: CURRENT,
    })
    // Provisional top: a,b,c. Extra: d. 1 extra → all-time=2 (a,b).
    expect(
      board.rows.map(({ id, rank, section }) => [id, rank, section]),
    ).toEqual([
      ['a', 1, 'all_time'],
      ['b', 2, 'all_time'],
      ['d', 2, 'current'], // 1st current is b (in all-time), d is 2nd current
    ])
  })
})
