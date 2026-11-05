import { describe, expect, it } from 'vitest'

import {
  buildInstagramPost,
  formatPostDate,
  gameHashtag,
  instagramCaption,
  instagramFileName,
  instagramHeadline,
  manualPostDate,
  manualPostId,
} from './instagram-post'
import type { InstagramPostInput } from './instagram-post'

const tetris: InstagramPostInput['game'] = {
  id: 'g-tetris',
  slug: 'tetris',
  name: 'Tetris',
  score_type: 'points',
  score_order: 'desc',
  score_unit: 'pts',
}

const marioKart: InstagramPostInput['game'] = {
  id: 'g-mario-kart',
  slug: 'mario-kart',
  name: 'Mario Kart',
  score_type: 'time',
  score_order: 'asc',
  score_unit: null,
}

const score = (
  overrides: Partial<InstagramPostInput['score']> = {},
): InstagramPostInput['score'] => ({
  id: 's1',
  game_id: tetris.id,
  event_id: 'now',
  player_name: 'Julie',
  score: 128_400,
  photo_path: 'submissions/s1.jpg',
  display_on_screen: true,
  instagram_handle: 'julie.retro',
  created_at: '2026-11-07T14:00:00Z',
  ...overrides,
})

const approved = (
  id: string,
  value: number,
  eventId = 'now',
  gameId = tetris.id,
) => ({
  id,
  game_id: gameId,
  event_id: eventId,
  score: value,
  created_at: '2026-11-07T10:00:00Z',
})

const build = (overrides: Partial<InstagramPostInput> = {}) =>
  buildInstagramPost({
    score: score(),
    game: tetris,
    eventName: 'Novembre 2026',
    approved: [],
    ...overrides,
  })

describe('buildInstagramPost', () => {
  it('ranks the score within its own event', () => {
    const post = build({
      approved: [
        approved('a', 200_000),
        approved('b', 100_000),
        approved('c', 300_000, 'april'),
        approved('d', 900_000, 'now', 'other-game'),
      ],
    })
    expect(post.rank).toBe(2)
    expect(post.allTime).toBe(false)
  })

  it('counts the score once when it is already among the approved', () => {
    const post = build({ approved: [approved('s1', 128_400)] })
    expect(post.rank).toBe(1)
  })

  it('says « record absolu » only when every other event is beaten', () => {
    expect(build({ approved: [approved('a', 100_000, 'april')] }).allTime).toBe(
      true,
    )
    expect(build({ approved: [approved('a', 128_400, 'april')] }).allTime).toBe(
      false,
    )
    // First score ever of a game: an event record, nothing to beat elsewhere.
    expect(build().allTime).toBe(false)
  })

  it('reads times the lower the better', () => {
    const post = build({
      game: marioKart,
      score: score({ game_id: marioKart.id, score: 92_480 }),
      approved: [approved('a', 95_000, 'april', marioKart.id)],
    })
    expect(post.scoreText).toBe(`1'32"48`)
    expect(post.rank).toBe(1)
    expect(post.allTime).toBe(true)
  })

  it('never shows the real name nor the photo of an anonymous score', () => {
    const post = build({
      score: score({ player_name: 'Camille Dupont', display_on_screen: false }),
    })
    expect(post.anonymous).toBe(true)
    expect(post.photoPath).toBeNull()
    expect(post.playerName).not.toContain('Camille')
    expect(instagramCaption(post)).not.toContain('Camille')
    expect(instagramCaption(post)).not.toContain('julie.retro')
  })

  it('gives an anonymous score the nickname of the screen when the seed is known', () => {
    const withSeed = (seed: string) =>
      build({
        score: score({ player_name: 'Camille', display_on_screen: false }),
        anonymousSeed: seed,
      }).playerName
    expect(withSeed('seed-a')).toBe(withSeed('seed-a'))
    expect(
      build({ score: score({ display_on_screen: false }) }).playerName,
    ).toBe(
      build({ score: score({ display_on_screen: false, player_name: null }) })
        .playerName,
    )
  })

  it('names a nameless score like the screen, and keeps its photo', () => {
    const post = build({ score: score({ player_name: null }) })
    expect(post.playerName).toBeTruthy()
    expect(post.anonymous).toBe(false)
    expect(post.photoPath).toBe('submissions/s1.jpg')
  })

  it('strips the @ of the handle', () => {
    expect(build({ score: score({ instagram_handle: '@julie' }) }).handle).toBe(
      'julie',
    )
    expect(
      build({ score: score({ instagram_handle: null }) }).handle,
    ).toBeNull()
  })
})

describe('formatPostDate', () => {
  it('writes the date and time in Paris time', () => {
    expect(formatPostDate('2026-11-07T13:32:00Z')).toBe('7 nov. 2026 à 14h32')
    expect(formatPostDate('2026-11-08T08:05:00Z')).toBe('8 nov. 2026 à 9h05')
    // Summer time: UTC+2.
    expect(formatPostDate('2026-04-11T22:30:00Z')).toBe('12 avr. 2026 à 0h30')
    expect(formatPostDate('pas une date')).toBe('')
  })

  it('takes the date of the score', () => {
    expect(build().scoredAt).toBe('2026-11-07T14:00:00Z')
  })
})

describe('instagramHeadline', () => {
  it('fits the rank', () => {
    expect(instagramHeadline({ rank: 1 })).toBe('Nouveau record !')
    expect(instagramHeadline({ rank: 3 })).toBe('Sur le podium !')
    expect(instagramHeadline({ rank: 7 })).toBe('Beau score !')
  })
})

describe('instagramCaption', () => {
  it('tags the player, the account and the game', () => {
    const caption = instagramCaption(build())
    expect(caption).toContain('Nouveau record sur Tetris !')
    expect(caption).toMatch(/Julie \(@julie\.retro\) a fait 128\s400 points/)
    expect(caption).toContain('(Novembre 2026)')
    expect(caption).toContain('@mate_dans_le_retro')
    expect(caption).toContain('#Tetris')
    expect(caption).toContain('#matedansleretro')
    expect(caption).toMatch(/\btu\b|\bTu\b/)
  })

  it('changes with the rank and the score type', () => {
    expect(
      instagramCaption(build({ approved: [approved('a', 100_000, 'april')] })),
    ).toMatch(/^Record absolu sur Tetris !/)
    expect(
      instagramCaption(build({ approved: [approved('a', 200_000)] })),
    ).toContain('monte sur le podium de Tetris : 2e place')
    const time = build({
      game: marioKart,
      score: score({ game_id: marioKart.id, score: 92_480 }),
    })
    expect(instagramCaption(time)).toContain(`un temps de 1'32"48`)
  })

  it('goes without a handle', () => {
    const caption = instagramCaption(
      build({ score: score({ instagram_handle: null }) }),
    )
    expect(caption).toContain('Julie a fait')
  })
})

describe('gameHashtag', () => {
  it('builds a camel-case tag without accents or punctuation', () => {
    expect(gameHashtag('Super Mario Bros.')).toBe('SuperMarioBros')
    expect(gameHashtag('Pac-Man')).toBe('PacMan')
    expect(gameHashtag('Pokémon Stadium')).toBe('PokemonStadium')
  })
})

describe('instagramFileName', () => {
  it('names the file after the game, the player and the rank', () => {
    expect(
      instagramFileName(
        { gameName: 'Super Mario Bros.', playerName: 'Zoé', rank: 1 },
        'png',
      ),
    ).toBe('mdlr-super-mario-bros-zoe-1.png')
  })
})

describe('manual posts', () => {
  it('stores and reads back the date of a post made by hand', () => {
    const id = manualPostId(new Date('2026-11-07T14:32:00Z'))
    expect(id).toBe('manual:2026-11-07T14:32:00.000Z')
    expect(manualPostDate(id)).toBe('2026-11-07T14:32:00.000Z')
    expect(manualPostDate('17895695668004550')).toBeNull()
    expect(manualPostDate(null)).toBeNull()
  })
})
