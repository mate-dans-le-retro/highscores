import { DEFAULT_SETTINGS } from '../source'
import type {
  EventEdition,
  Game,
  GameEventSetup,
  Score,
  Settings,
} from '../types'

// Fictional names, taken from the mockups: the repository is public.

const PAST_EVENT = 'evt-2026-04'
const CURRENT_EVENT = 'evt-2026-11'

export const seedEvents: Array<EventEdition> = [
  {
    id: PAST_EVENT,
    name: "Weekend d'avril 2026",
    archived_at: '2026-04-12T18:00:00Z',
  },
  { id: CURRENT_EVENT, name: 'Novembre 2026', archived_at: null },
]

/** Placeholder cover so the mock can exercise the image path before real art. */
const placeholderCover = (label: string, fill: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320"><rect width="320" height="320" fill="${fill}"/><text x="160" y="175" text-anchor="middle" font-family="monospace" font-size="64" fill="#fff">${label}</text></svg>`,
  )}`

function game(
  slug: string,
  name: string,
  short_label: string,
  gameConsole: string,
  position: number,
  overrides: Partial<Game> = {},
): Game {
  return {
    id: `g-${slug}`,
    slug,
    name,
    short_label,
    console: gameConsole,
    score_type: 'points',
    score_order: 'desc',
    score_unit: 'pts',
    visible: true,
    position,
    // Most seeded games ship a placeholder cover; leave null to demo the trigramme fallback.
    cover_path: placeholderCover(short_label, '#5a3a8a'),
    ...overrides,
  }
}

export const seedGames: Array<Game> = [
  game('tetris', 'Tetris', 'TET', 'Game Boy', 1),
  game('duck-hunt', 'Duck Hunt', 'DH', 'NES', 2),
  game('super-mario-bros', 'Super Mario Bros.', 'SMB', 'NES', 3),
  game('guitar-hero', 'Guitar Hero', 'GH', 'PS2', 4),
  // No cover on purpose: the UI must fall back to short_label ("PAC").
  game('pac-man', 'Pac-Man', 'PAC', 'Arcade', 5, { cover_path: null }),
  game('mario-kart', 'Mario Kart', 'MK', 'Super NES', 6, {
    score_type: 'time',
    score_order: 'asc',
    score_unit: null,
  }),
  game('street-fighter-2', 'Street Fighter II', 'SF2', 'Super NES', 7, {
    visible: false,
  }),
]

const setup = (
  event_id: string,
  gameSlug: string,
  station_label: string | null,
): GameEventSetup => ({ event_id, game_id: `g-${gameSlug}`, station_label })

/** Duck Hunt moved between events: its April record keeps the "Tournoi" label. */
export const seedGameEventSetups: Array<GameEventSetup> = [
  setup(PAST_EVENT, 'duck-hunt', 'Tournoi'),
  setup(CURRENT_EVENT, 'duck-hunt', 'Étage'),
  setup(CURRENT_EVENT, 'tetris', 'Borne 3'),
  setup(CURRENT_EVENT, 'mario-kart', null),
]

/** Stands in for a player photo: every player submission has one. */
const DEMO_PHOTO = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#5a3a8a"/></svg>',
)}`

let nextId = 1

function score(
  gameSlug: string | null,
  player_name: string,
  value: number,
  overrides: Partial<Score> = {},
): Score {
  return {
    id: `s-${nextId++}`,
    event_id: CURRENT_EVENT,
    game_id: gameSlug && `g-${gameSlug}`,
    custom_game_name: null,
    player_name,
    score: value,
    photo_path: DEMO_PHOTO,
    display_on_screen: true,
    instagram_consent: false,
    instagram_handle: null,
    detected_game_id: null,
    detected_score: null,
    status: 'approved',
    source: 'player',
    created_at: '2026-11-07T10:00:00Z',
    reviewed_at: '2026-11-07T10:05:00Z',
    ...overrides,
  }
}

const pending = { status: 'pending', reviewed_at: null } as const

export const seedScores: Array<Score> = [
  score('tetris', 'Julie', 128_400, {
    created_at: '2026-11-07T13:32:00Z',
    instagram_consent: true,
  }),
  score('tetris', 'Marc', 98_200),
  score('tetris', 'Sam', 87_650, { source: 'admin', photo_path: null }),
  score('tetris', 'Inès', 64_300),
  score('tetris', 'Thomas', 52_100),
  score('tetris', 'Zoé', 41_000, { display_on_screen: false }),
  score('duck-hunt', 'Léa', 24_500),
  score('duck-hunt', 'Marc', 31_200, {
    event_id: PAST_EVENT,
    created_at: '2026-04-11T15:00:00Z',
  }),
  score('super-mario-bros', 'Paul', 412_300),
  score('guitar-hero', 'Hugo', 298_450),
  score('pac-man', 'Nora', 96_720),
  score('mario-kart', 'Yanis', 92_480),
  score('mario-kart', 'Lina', 95_100),
  score('street-fighter-2', 'Ryu', 120_000),
  score('guitar-hero', 'Antoine', 412_850, {
    ...pending,
    created_at: '2026-11-07T15:10:00Z',
    instagram_consent: true,
    instagram_handle: '@antoine.demo',
  }),
  score(null, 'Chloé', 15_000, {
    ...pending,
    custom_game_name: 'Bomberman',
    created_at: '2026-11-07T15:20:00Z',
  }),
]

export const seedSettings: Settings = DEFAULT_SETTINGS
