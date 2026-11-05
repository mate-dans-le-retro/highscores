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
const past = (id: string, score: number) => row(id, score, PAST, 'Past')
const now = (id: string, score: number) => row(id, score, CURRENT, 'Now')

const layout = (board: ReturnType<typeof buildScreenLeaderboard>) =>
  board.rows.map(({ id, rank, section }) => `${section}:${id}:${rank}`)

/** Guitar Hero in the mock seed: 3 past, 2 current, 7 past, 5 current. */
const guitarHero = () => [
  past('alex', 520_000),
  past('bea', 505_000),
  past('chris', 490_000),
  now('hugo', 480_000),
  now('iris', 470_000),
  past('dana', 460_000),
  past('eli', 450_000),
  past('fran', 440_000),
  past('gus', 430_000),
  past('hana', 420_000),
  past('jo', 410_000),
  past('kim', 400_000),
  now('lou', 210_000),
  now('max', 195_000),
  now('noe', 180_000),
  now('ophelie', 165_000),
  now('pia', 150_000),
]

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
    expect(
      board.rows.map(({ id, dimmed, section }) => [id, dimmed, section]),
    ).toEqual([
      ['julie', false, 'all_time'],
      ['marc-past', true, 'all_time'],
      ['sam', false, 'all_time'],
    ])
  })

  it('shows only past rows, without separator, when the event has no score', () => {
    const board = buildScreenLeaderboard(
      [past('a', 30), past('b', 20), past('c', 10)],
      'desc',
      { rowsShown: 10, minAllTimeRows: 5, currentEventId: CURRENT },
    )
    expect(board.separator_at).toBeNull()
    expect(board.rows.every((r) => r.dimmed)).toBe(true)
  })

  it('puts current-event scores outside the top under a separator', () => {
    const scores = [
      past('a', 100),
      past('b', 90),
      past('c', 80),
      past('d', 70),
      past('e', 60),
      now('f', 50),
      now('g', 40),
    ]
    const board = buildScreenLeaderboard(scores, 'desc', {
      rowsShown: 5,
      minAllTimeRows: 3,
      currentEventId: CURRENT,
    })
    expect(layout(board)).toEqual([
      'all_time:a:1',
      'all_time:b:2',
      'all_time:c:3',
      'current:f:6',
      'current:g:7',
    ])
    expect(board.separator_at).toBe(3)
  })

  it('shrinks the block one row per extra (9+1)', () => {
    const scores = [
      ...Array.from({ length: 12 }, (_, i) => past(`p${i}`, 100 - i)),
      now('late', 1),
    ]
    const board = buildScreenLeaderboard(scores, 'desc', {
      rowsShown: 10,
      minAllTimeRows: 5,
      currentEventId: CURRENT,
    })
    expect(board.separator_at).toBe(9)
    expect(board.rows.at(-1)?.id).toBe('late')
    expect(board.rows.at(-1)?.rank).toBe(13)
  })

  it('never shrinks the all-time block below M and drops the lowest extras', () => {
    const scores = [
      ...Array.from({ length: 8 }, (_, i) => past(`past-${i}`, 200 - i)),
      ...Array.from({ length: 8 }, (_, i) => now(`now-${i}`, 50 - i)),
    ]
    const board = buildScreenLeaderboard(scores, 'desc', {
      rowsShown: 10,
      minAllTimeRows: 5,
      currentEventId: CURRENT,
    })
    const extras = board.rows.filter((r) => r.section === 'current')
    expect(board.separator_at).toBe(5)
    expect(extras.map((r) => r.id)).toEqual([
      'now-0',
      'now-1',
      'now-2',
      'now-3',
      'now-4',
    ])
  })

  it('does not duplicate a current-event row already in the all-time top', () => {
    const board = buildScreenLeaderboard(
      [now('julie', 128_400), past('marc', 98_200), now('sam', 40_000)],
      'desc',
      { rowsShown: 2, minAllTimeRows: 1, currentEventId: CURRENT },
    )
    expect(layout(board)).toEqual(['all_time:julie:1', 'current:sam:3'])
  })

  it('lays out the Guitar Hero seed as 5 + 5', () => {
    const board = buildScreenLeaderboard(guitarHero(), 'desc', {
      rowsShown: 10,
      minAllTimeRows: 5,
      currentEventId: CURRENT,
    })
    expect(layout(board)).toEqual([
      'all_time:alex:1',
      'all_time:bea:2',
      'all_time:chris:3',
      'all_time:hugo:4',
      'all_time:iris:5',
      'current:lou:13',
      'current:max:14',
      'current:noe:15',
      'current:ophelie:16',
      'current:pia:17',
    ])
  })

  it('keeps Iris when Antoine pushes her out of the block (review bug 2)', () => {
    const board = buildScreenLeaderboard(
      [...guitarHero(), now('antoine', 485_000)],
      'desc',
      { rowsShown: 10, minAllTimeRows: 5, currentEventId: CURRENT },
    )
    expect(layout(board)).toEqual([
      'all_time:alex:1',
      'all_time:bea:2',
      'all_time:chris:3',
      'all_time:antoine:4',
      'all_time:hugo:5',
      'current:iris:6',
      'current:lou:14',
      'current:max:15',
      'current:noe:16',
      'current:ophelie:17',
    ])
  })

  it('ranks times with the lowest first', () => {
    const board = buildScreenLeaderboard(
      [now('slow', 101_500), past('tom', 98_200), now('fast', 92_480)],
      'asc',
      { rowsShown: 2, minAllTimeRows: 1, currentEventId: CURRENT },
    )
    expect(layout(board)).toEqual(['all_time:fast:1', 'current:slow:3'])
  })

  it('shares the rank on ties, on both sides of the separator', () => {
    const board = buildScreenLeaderboard(
      [past('a', 100), past('b', 90), now('c', 90), now('d', 50)],
      'desc',
      { rowsShown: 3, minAllTimeRows: 2, currentEventId: CURRENT },
    )
    expect(layout(board)).toEqual([
      'all_time:a:1',
      'all_time:b:2',
      'current:c:2',
    ])
  })
})

describe('buildScreenLeaderboard invariants', () => {
  // Small deterministic generator, so a failure always replays the same way.
  function random(seed: number) {
    let state = seed
    return () => {
      state = (state * 1_103_515_245 + 12_345) % 2_147_483_648
      return state / 2_147_483_648
    }
  }

  it('never hides a current score while showing a lower one', () => {
    const next = random(42)
    for (let round = 0; round < 500; round++) {
      const count = Math.floor(next() * 25)
      const scores = Array.from({ length: count }, (_, i) =>
        next() < 0.5
          ? past(`p${i}`, Math.floor(next() * 40))
          : now(`c${i}`, Math.floor(next() * 40)),
      )
      const rowsShown = 1 + Math.floor(next() * 10)
      const minAllTimeRows = 1 + Math.floor(next() * 10)
      const board = buildScreenLeaderboard(scores, 'desc', {
        rowsShown,
        minAllTimeRows,
        currentEventId: CURRENT,
      })
      const ids = board.rows.map((r) => r.id)
      const sorted = [...scores].sort((a, b) => b.score - a.score)
      const block = board.rows.filter((r) => r.section === 'all_time')
      const extras = board.rows.filter((r) => r.section === 'current')

      expect(board.rows.length).toBeLessThanOrEqual(rowsShown)
      expect(new Set(ids).size).toBe(ids.length)
      expect(board.rows.length).toBe(Math.min(rowsShown, count))
      expect(block.length).toBeGreaterThanOrEqual(
        Math.min(count, rowsShown, minAllTimeRows),
      )
      // The block is the top of the ranking, ties included in any order.
      block.forEach((r, i) => expect(r.score).toBe(sorted[i]?.score))
      expect(extras.every((r) => r.event_id === CURRENT)).toBe(true)
      // Ranks only go down the screen.
      board.rows.forEach((r, i) => {
        if (i > 0) expect(r.rank).toBeGreaterThanOrEqual(board.rows[i - 1].rank)
      })
      // No current score is skipped above the lowest one shown.
      const lowest = board.rows.at(-1)
      if (lowest) {
        const skipped = scores.filter(
          (s) =>
            s.event_id === CURRENT &&
            s.score > lowest.score &&
            !ids.includes(s.id),
        )
        expect(skipped).toEqual([])
      }
    }
  })
})
