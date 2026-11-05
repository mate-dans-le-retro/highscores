import { DEFAULT_SETTINGS } from '../source'
import type {
  EventEdition,
  Game,
  GameEventSetup,
  Score,
  Settings,
} from '../types'

// Fictional names, taken from the mockups: the repository is public.
// The seed is deliberately varied so every public-screen state can be demoed:
// empty, past-only, few current, dense past + current mid/bottom (9+1…5+5),
// anonymous, pending, time-based, and "Un autre jeu".

const EVENT_2025 = 'evt-2025-11'
const EVENT_APRIL = 'evt-2026-04'
const CURRENT_EVENT = 'evt-2026-11'

export const seedEvents: Array<EventEdition> = [
  {
    id: EVENT_2025,
    name: 'Novembre 2025',
    archived_at: '2025-11-09T18:00:00Z',
  },
  {
    id: EVENT_APRIL,
    name: "Weekend d'avril 2026",
    archived_at: '2026-04-12T18:00:00Z',
  },
  { id: CURRENT_EVENT, name: 'Novembre 2026', archived_at: null },
]

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
    // No fake art: games show their trigramme until a real image is set.
    cover_path: null,
    ...overrides,
  }
}

export const seedGames: Array<Game> = [
  // Few current records (mockup names).
  game('tetris', 'Tetris', 'TET', 'Game Boy', 1),
  // Past-event records only: nothing from the current edition.
  game('duck-hunt', 'Duck Hunt', 'DH', 'NES', 2),
  // A couple of current scores only.
  game('super-mario-bros', 'Super Mario Bros.', 'SMB', 'NES', 3),
  // Dense past top + current mid/bottom → exercises 9+1…5+5 shrink.
  game('guitar-hero', 'Guitar Hero', 'GH', 'PS2', 4),
  game('pac-man', 'Pac-Man', 'PAC', 'Arcade', 5),
  // Time-based ranking (lowest wins).
  game('mario-kart', 'Mario Kart', 'MK', 'Super NES', 6, {
    score_type: 'time',
    score_order: 'asc',
    score_unit: null,
  }),
  // Visible empty state: no approved score at all.
  game('space-invaders', 'Space Invaders', 'SI', 'Arcade', 7),
  game('street-fighter-2', 'Street Fighter II', 'SF2', 'Super NES', 8, {
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
  setup(EVENT_2025, 'duck-hunt', 'Salon'),
  setup(EVENT_APRIL, 'duck-hunt', 'Tournoi'),
  setup(EVENT_APRIL, 'guitar-hero', 'Scène'),
  setup(EVENT_APRIL, 'tetris', 'Cave'),
  setup(CURRENT_EVENT, 'duck-hunt', 'Étage'),
  setup(CURRENT_EVENT, 'tetris', 'Borne 3'),
  setup(CURRENT_EVENT, 'guitar-hero', 'Scène'),
  setup(CURRENT_EVENT, 'super-mario-bros', 'Salon'),
  setup(CURRENT_EVENT, 'mario-kart', null),
  setup(CURRENT_EVENT, 'pac-man', 'Borne 1'),
  setup(CURRENT_EVENT, 'space-invaders', 'Arcade'),
]

/** Varied player-photo placeholders (different fills / labels). */
const demoPhoto = (label: string, fill: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="${fill}"/><text x="400" y="320" text-anchor="middle" font-family="monospace" font-size="48" fill="#fff">${label}</text></svg>`,
  )}`

const PHOTO = {
  julie: demoPhoto('Julie', '#ea4592'),
  marc: demoPhoto('Marc', '#5a3a8a'),
  sam: demoPhoto('Sam', '#2a9d8f'),
  ines: demoPhoto('Inès', '#e76f51'),
  thomas: demoPhoto('Thomas', '#264653'),
  zoe: demoPhoto('Zoé', '#6a4c93'),
  lea: demoPhoto('Léa', '#f4a261'),
  paul: demoPhoto('Paul', '#bc4749'),
  hugo: demoPhoto('Hugo', '#e9c46a'),
  nora: demoPhoto('Nora', '#457b9d'),
  yanis: demoPhoto('Yanis', '#1d3557'),
  lina: demoPhoto('Lina', '#a8dadc'),
  antoine: demoPhoto('Antoine', '#ff6b6b'),
  chloe: demoPhoto('Chloé', '#4ecdc4'),
  past: demoPhoto('2025', '#331655'),
  april: demoPhoto('Avril', '#7b2cbf'),
  current: demoPhoto('Nov.', '#9b5de5'),
  anon: demoPhoto('?', '#22223b'),
} as const

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
    photo_path: PHOTO.current,
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

const pastApril = (
  gameSlug: string,
  player_name: string,
  value: number,
  created_at: string,
  photo_path: string = PHOTO.april,
) =>
  score(gameSlug, player_name, value, {
    event_id: EVENT_APRIL,
    created_at,
    reviewed_at: created_at,
    photo_path,
  })

const past2025 = (
  gameSlug: string,
  player_name: string,
  value: number,
  created_at: string,
) =>
  score(gameSlug, player_name, value, {
    event_id: EVENT_2025,
    created_at,
    reviewed_at: created_at,
    photo_path: PHOTO.past,
  })

export const seedScores: Array<Score> = [
  // --- Tetris: few current records (mockup cast) + one older dimmed row ---
  score('tetris', 'Julie', 128_400, {
    created_at: '2026-11-07T13:32:00Z',
    instagram_consent: true,
    photo_path: PHOTO.julie,
  }),
  score('tetris', 'Marc', 98_200, { photo_path: PHOTO.marc }),
  score('tetris', 'Sam', 87_650, {
    source: 'admin',
    photo_path: null,
  }),
  score('tetris', 'Inès', 64_300, { photo_path: PHOTO.ines }),
  score('tetris', 'Thomas', 52_100, { photo_path: PHOTO.thomas }),
  score('tetris', 'Zoé', 41_000, {
    display_on_screen: false,
    photo_path: PHOTO.zoe,
  }),
  pastApril('tetris', 'Karim', 55_000, '2026-04-11T16:20:00Z'),

  // --- Duck Hunt: past events only (empty current edition) ---
  past2025('duck-hunt', 'Nina', 28_400, '2025-11-08T14:00:00Z'),
  pastApril('duck-hunt', 'Marc', 31_200, '2026-04-11T15:00:00Z', PHOTO.marc),
  pastApril('duck-hunt', 'Léa', 24_500, '2026-04-12T11:30:00Z', PHOTO.lea),
  pastApril('duck-hunt', 'Omar', 19_800, '2026-04-11T17:45:00Z'),

  // --- Super Mario Bros.: a couple of current scores ---
  score('super-mario-bros', 'Paul', 412_300, { photo_path: PHOTO.paul }),
  score('super-mario-bros', 'Camille', 298_100, {
    created_at: '2026-11-07T11:15:00Z',
    photo_path: PHOTO.current,
  }),

  // --- Guitar Hero: dense past + current mid/bottom (default view = 5+5) ---
  // Three past records above the current mid, so Hugo/Iris stay in the
  // all-time block even when five current extras shrink it to M=5.
  past2025('guitar-hero', 'Alex', 520_000, '2025-11-08T12:00:00Z'),
  past2025('guitar-hero', 'Béa', 505_000, '2025-11-08T13:00:00Z'),
  pastApril('guitar-hero', 'Chris', 490_000, '2026-04-11T12:00:00Z'),
  // Current scores in the middle of the all-time top (not dimmed).
  score('guitar-hero', 'Hugo', 480_000, {
    created_at: '2026-11-07T12:00:00Z',
    photo_path: PHOTO.hugo,
  }),
  score('guitar-hero', 'Iris', 470_000, {
    created_at: '2026-11-07T12:30:00Z',
    photo_path: PHOTO.current,
  }),
  // More past under the mid currents (fill the provisional top of 10).
  pastApril('guitar-hero', 'Dana', 460_000, '2026-04-11T13:00:00Z'),
  pastApril('guitar-hero', 'Eli', 450_000, '2026-04-11T14:00:00Z'),
  pastApril('guitar-hero', 'Fran', 440_000, '2026-04-11T15:00:00Z'),
  pastApril('guitar-hero', 'Gus', 430_000, '2026-04-11T16:00:00Z'),
  pastApril('guitar-hero', 'Hana', 420_000, '2026-04-11T17:00:00Z'),
  pastApril('guitar-hero', 'Jo', 410_000, '2026-04-12T10:00:00Z'),
  pastApril('guitar-hero', 'Kim', 400_000, '2026-04-12T11:00:00Z'),
  // Current scores under the top → separator extras (5 → 5+5 with M=5).
  score('guitar-hero', 'Lou', 210_000, {
    created_at: '2026-11-07T14:00:00Z',
    photo_path: PHOTO.current,
  }),
  score('guitar-hero', 'Max', 195_000, {
    created_at: '2026-11-07T14:20:00Z',
    photo_path: PHOTO.current,
  }),
  score('guitar-hero', 'Noé', 180_000, {
    created_at: '2026-11-07T14:40:00Z',
    photo_path: PHOTO.current,
  }),
  score('guitar-hero', 'Ophélie', 165_000, {
    created_at: '2026-11-07T15:00:00Z',
    display_on_screen: false,
    photo_path: PHOTO.anon,
  }),
  score('guitar-hero', 'Pia', 150_000, {
    created_at: '2026-11-07T15:20:00Z',
    photo_path: PHOTO.current,
  }),
  // Pending (not on the public board until approved).
  score('guitar-hero', 'Antoine', 485_000, {
    ...pending,
    created_at: '2026-11-07T15:10:00Z',
    instagram_consent: true,
    instagram_handle: '@antoine.demo',
    photo_path: PHOTO.antoine,
  }),

  // --- Pac-Man: trigramme cover fallback + mixed events ---
  score('pac-man', 'Nora', 96_720, { photo_path: PHOTO.nora }),
  pastApril('pac-man', 'Rémi', 88_100, '2026-04-11T18:00:00Z'),
  score('pac-man', 'Sacha', 72_400, {
    created_at: '2026-11-07T16:00:00Z',
    display_on_screen: false,
    photo_path: PHOTO.anon,
  }),

  // --- Mario Kart: time-based (ms), lowest wins ---
  score('mario-kart', 'Yanis', 92_480, { photo_path: PHOTO.yanis }),
  score('mario-kart', 'Lina', 95_100, { photo_path: PHOTO.lina }),
  pastApril('mario-kart', 'Tom', 98_200, '2026-04-12T12:00:00Z'),
  score('mario-kart', 'Éva', 101_500, {
    created_at: '2026-11-07T16:30:00Z',
    photo_path: PHOTO.current,
  }),

  // --- Space Invaders: intentionally empty (no scores) ---

  // --- Hidden game still has a score for admin-side demos ---
  score('street-fighter-2', 'Ryu', 120_000),

  // --- "Un autre jeu": free submission, no game_id ---
  score(null, 'Chloé', 15_000, {
    ...pending,
    custom_game_name: 'Bomberman',
    created_at: '2026-11-07T15:20:00Z',
    photo_path: PHOTO.chloe,
  }),
]

export const seedSettings: Settings = DEFAULT_SETTINGS
