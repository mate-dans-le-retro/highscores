import { describe, expect, it } from 'vitest'

import { anonymousName } from '../anonymous-name'
import { mockSource } from './mock-source'

// Outside a browser, the store serves the seed without touching localStorage.

describe('mockSource on the seed', () => {
  it('builds a screen leaderboard and anonymizes scores kept off screen', async () => {
    const board = await mockSource.getLeaderboard('g-tetris', { rows: 10 })
    expect(board.empty).toBe(false)
    expect(board.rows.map(({ rank }) => rank)).toEqual([1, 2, 3, 4, 5, 6])
    const zoe = board.rows.at(5)
    expect(zoe).toBeDefined()
    expect(zoe!.anonymous).toBe(true)
    expect(zoe!.photo_path).toBeNull()
    expect(zoe!.player_name).toBe(
      anonymousName({ playerName: 'Zoé', gameId: 'g-tetris' }),
    )
    expect(JSON.stringify(board.rows)).not.toContain('Zoé')
  })

  it('ranks times with the lowest first', async () => {
    const board = await mockSource.getLeaderboard('g-mario-kart', { rows: 10 })
    expect(board.rows.map(({ player_name }) => player_name)).toEqual([
      'Yanis',
      'Lina',
    ])
  })

  it('dims past-event rows and keeps current-event rows full in the all-time block', async () => {
    const board = await mockSource.getLeaderboard('g-duck-hunt', { rows: 10 })
    const marc = board.rows.find((row) => row.player_name === 'Marc')
    const lea = board.rows.find((row) => row.player_name === 'Léa')
    expect(marc?.dimmed).toBe(true)
    expect(marc?.event_name).toBe("Weekend d'avril 2026")
    expect(lea?.dimmed).toBe(false)
    expect(board.separator_at).toBeNull()
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
    expect(duckHunt?.current?.player_name).toBe('Léa')
    expect(duckHunt?.all_time?.player_name).toBe('Marc')
    expect(duckHunt?.all_time?.station_label).toBe('Tournoi')
  })

  it('gives the runner-up as the record that was beaten', async () => {
    const records = await mockSource.listRecords()
    const tetris = records.find(({ game }) => game.slug === 'tetris')
    expect(tetris?.current?.player_name).toBe('Julie')
    expect(tetris?.runner_up?.player_name).toBe('Marc')
  })

  it('exposes a cover image or leaves null for the trigramme fallback', async () => {
    const games = await mockSource.listVisibleGames()
    const tetris = games.find(({ slug }) => slug === 'tetris')
    const pacMan = games.find(({ slug }) => slug === 'pac-man')
    expect(tetris?.cover_path).toMatch(/^data:image\/svg\+xml/)
    expect(pacMan?.cover_path).toBeNull()
    expect(pacMan?.short_label).toBe('PAC')
  })
})
