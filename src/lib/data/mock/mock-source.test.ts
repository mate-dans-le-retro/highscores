import { describe, expect, it } from 'vitest'

import { ANONYMOUS_NAMES } from '../anonymize'
import { mockSource } from './mock-source'

// Outside a browser, the store serves the seed without touching localStorage.

describe('mockSource on the seed', () => {
  it('ranks the leaderboard and anonymizes scores kept off screen', async () => {
    const rows = await mockSource.getLeaderboard('g-tetris', 10)
    expect(rows.map(({ rank }) => rank)).toEqual([1, 2, 3, 4, 5, 6])
    const zoe = rows[5]
    expect(zoe.anonymous).toBe(true)
    expect(zoe.photo_path).toBeNull()
    expect(ANONYMOUS_NAMES).toContain(zoe.player_name)
    expect(JSON.stringify(rows)).not.toContain('Zoé')
  })

  it('ranks times with the lowest first', async () => {
    const rows = await mockSource.getLeaderboard('g-mario-kart', 10)
    expect(rows.map(({ player_name }) => player_name)).toEqual([
      'Yanis',
      'Lina',
    ])
  })

  it('serves hidden games to nobody', async () => {
    expect(await mockSource.getLeaderboard('g-street-fighter-2', 10)).toEqual(
      [],
    )
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
})
