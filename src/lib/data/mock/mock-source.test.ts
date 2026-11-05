import { describe, expect, it } from 'vitest'

import { anonymousName } from '../anonymous-name'
import { mockSource } from './mock-source'

// Outside a browser, the store serves the seed without touching localStorage.

describe('mockSource on the seed', () => {
  it('builds a screen leaderboard and anonymizes scores kept off screen', async () => {
    const board = await mockSource.getLeaderboard('g-tetris', { rows: 10 })
    expect(board.empty).toBe(false)
    const zoe = board.rows.find((row) => row.anonymous)
    expect(zoe).toBeDefined()
    expect(zoe!.photo_path).toBeNull()
    expect(zoe!.player_name).toBe(
      anonymousName({ playerName: 'Zoé', gameId: 'g-tetris' }),
    )
    expect(JSON.stringify(board.rows)).not.toContain('Zoé')
  })

  it('names a score sent without a name after its id, photo included', async () => {
    const board = await mockSource.getLeaderboard('g-super-mario-bros', {
      rows: 10,
    })
    const nameless = board.rows.find(
      ({ player_name }) => !['Paul', 'Camille'].includes(player_name),
    )
    expect(nameless?.anonymous).toBe(false)
    expect(nameless?.photo_path).not.toBeNull()
    expect(nameless?.player_name).toBe(
      anonymousName({ playerName: nameless!.id, gameId: 'g-super-mario-bros' }),
    )
  })

  it('ranks times with the lowest first', async () => {
    const board = await mockSource.getLeaderboard('g-mario-kart', { rows: 10 })
    expect(board.rows.map(({ player_name }) => player_name)).toEqual([
      'Yanis',
      'Lina',
      'Tom',
      'Éva',
    ])
    expect(board.rows.find((row) => row.player_name === 'Tom')?.dimmed).toBe(
      true,
    )
  })

  it('dims past-event rows when the current edition has no score', async () => {
    const board = await mockSource.getLeaderboard('g-duck-hunt', { rows: 10 })
    expect(board.empty).toBe(false)
    expect(board.rows.every((row) => row.dimmed)).toBe(true)
    expect(board.rows.every((row) => row.event_id !== 'evt-2026-11')).toBe(true)
    expect(board.separator_at).toBeNull()
    const marc = board.rows.find((row) => row.player_name === 'Marc')
    expect(marc?.event_name).toBe("Weekend d'avril 2026")
  })

  it('exposes an empty visible game for the empty state', async () => {
    const board = await mockSource.getLeaderboard('g-space-invaders', {
      rows: 10,
    })
    expect(board).toEqual({ rows: [], separator_at: null, empty: true })
    const games = await mockSource.listVisibleGames()
    expect(games.map(({ slug }) => slug)).toContain('space-invaders')
  })

  it('shrinks the all-time block when current extras sit under the separator', async () => {
    const board = await mockSource.getLeaderboard('g-guitar-hero', {
      rows: 10,
      minAllTimeRows: 5,
    })
    expect(board.empty).toBe(false)
    // Five current extras → all-time block shrinks to M=5 (5+5).
    expect(board.separator_at).toBe(5)
    expect(board.rows).toHaveLength(10)
    const allTime = board.rows.slice(0, 5)
    const extras = board.rows.slice(5)
    expect(
      allTime.map(({ player_name, dimmed }) => [player_name, dimmed]),
    ).toEqual([
      ['Alex', true],
      ['Béa', true],
      ['Chris', true],
      ['Hugo', false],
      ['Iris', false],
    ])
    expect(
      extras.every((row) => row.section === 'current' && !row.dimmed),
    ).toBe(true)
    expect(extras.map(({ player_name }) => player_name)).toEqual([
      'Lou',
      'Max',
      'Noé',
      anonymousName({ playerName: 'Ophélie', gameId: 'g-guitar-hero' }),
      'Pia',
    ])
  })

  it('serves hidden games to nobody', async () => {
    expect(
      await mockSource.getLeaderboard('g-street-fighter-2', { rows: 10 }),
    ).toEqual({ rows: [], separator_at: null, empty: true })
    const games = await mockSource.listVisibleGames()
    expect(games.map(({ slug }) => slug)).not.toContain('street-fighter-2')
  })

  it('keeps the station label of the event an all-time record comes from', async () => {
    const records = await mockSource.listRecords()
    const duckHunt = records.find(({ game }) => game.slug === 'duck-hunt')
    expect(duckHunt?.game.station_label).toBe('Étage')
    expect(duckHunt?.current).toBeNull()
    expect(duckHunt?.all_time?.player_name).toBe('Marc')
    expect(duckHunt?.all_time?.station_label).toBe('Tournoi')
  })

  it('gives the runner-up as the record that was beaten', async () => {
    const records = await mockSource.listRecords()
    const tetris = records.find(({ game }) => game.slug === 'tetris')
    expect(tetris?.current?.player_name).toBe('Julie')
    expect(tetris?.runner_up?.player_name).toBe('Marc')
  })

  it('ships no fake cover: games show their trigramme', async () => {
    const games = await mockSource.listVisibleGames()
    expect(games.every(({ cover_path }) => cover_path === null)).toBe(true)
    expect(games.find(({ slug }) => slug === 'pac-man')?.short_label).toBe(
      'PAC',
    )
  })
})
