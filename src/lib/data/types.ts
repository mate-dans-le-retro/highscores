// Hand-written rows, in snake_case like Postgres. To be replaced by
// `supabase gen types` plus a mapping once the schema catches up.

import type { PreparedPhoto } from './photo'

export type ScoreOrder = 'desc' | 'asc'
/** To add a type, add it here and give it a formatter in src/lib/format.ts. */
export type ScoreType = 'points' | 'time' | 'other'
export type ScoreStatus = 'pending' | 'approved' | 'rejected'
export type ScoreSource = 'player' | 'admin'
export type ScreenMode = 'game' | 'wall' | 'both'

export interface Game {
  id: string
  slug: string
  name: string
  /**
   * Trigramme shown in the game tile when there is no cover image: "TET", "DH".
   * Legal/placeholder fallback only; prefer `cover_path` once real art lands.
   */
  short_label: string
  /** Stable across events ("Super NES"). The eyebrow adds the station label. */
  console: string | null
  score_type: ScoreType
  score_order: ScoreOrder
  score_unit: string | null
  visible: boolean
  position: number
  /**
   * Cover or character image for the game tile. null → show `short_label`.
   * Mock: path under /public or a data URL; Supabase: path in the covers bucket.
   */
  cover_path: string | null
}

export interface EventEdition {
  id: string
  name: string
  /** null for the current event. */
  archived_at: string | null
}

/** How a game is set up for one event. Editing it never touches past scores. */
export interface GameEventSetup {
  event_id: string
  game_id: string
  /** Nickname or location of the station for that event ("Étage", "Tournoi"). */
  station_label: string | null
}

/** A visible game, with its station label for the current event. */
export interface DisplayedGame extends Game {
  station_label: string | null
}

export interface Score {
  id: string
  event_id: string
  /** null when the player picked "Un autre jeu": see custom_game_name. */
  game_id: string | null
  /** Free game name typed by the player, until a volunteer creates or links the game. */
  custom_game_name: string | null
  /** null when the player left it empty: the screen shows a nickname seeded by the id. */
  player_name: string | null
  /** Points, or milliseconds when the game's score_type is 'time'. */
  score: number
  /**
   * Mock: `mock-photo:{id}` in IndexedDB (proof + thumb).
   * Supabase: path in the photos bucket.
   */
  photo_path: string | null
  display_on_screen: boolean
  instagram_consent: boolean
  instagram_handle: string | null
  detected_game_id: string | null
  detected_score: number | null
  status: ScoreStatus
  source: ScoreSource
  created_at: string
  reviewed_at: string | null
}

/**
 * Public row. An anonymous score (the player unticked the display) stays
 * ranked, but comes with a fun nickname and without the photo.
 */
export interface LeaderboardRow {
  id: string
  game_id: string
  event_id: string
  player_name: string
  score: number
  photo_path: string | null
  anonymous: boolean
  created_at: string
  /** SQL rank(): ties share the place. */
  rank: number
}

export interface AllTimeRecord extends LeaderboardRow {
  event_name: string | null
  /** Station label of the event the record comes from, not the current one. */
  station_label: string | null
}

export interface GameRecord {
  game: DisplayedGame
  /** First place of the current event. */
  current: LeaderboardRow | null
  /** Second place: the record that `current` beat ("Ancien record"). */
  runner_up: LeaderboardRow | null
  /** Best approved score across all events, archived ones included. */
  all_time: AllTimeRecord | null
}

export interface NewRecord {
  game: DisplayedGame
  record: LeaderboardRow
  previous: LeaderboardRow | null
  /** Beats the best existing score of every event ("RECORD ABSOLU"). */
  all_time: boolean
}

export interface Settings {
  submissions_open: boolean
  screen_mode: ScreenMode
  game_duration_s: 15 | 30 | 60
  wall_duration_s: 10 | 20 | 30
  /** N: total rows on the public screen (default 10). */
  rows_shown: 3 | 5 | 10
  /** M: all-time block never shrinks below this (default 5). */
  min_all_time_rows: 3 | 5 | 10
  /** Title and logo above the public screen (hidden by default). */
  show_header: boolean
}

/** Either game_id or custom_game_name is set, never both. */
export interface SubmissionInput {
  /**
   * Chosen on the phone, so that the form previews the nickname of a nameless
   * score. Sending the same id twice stores the score once.
   */
  id: string
  game_id: string | null
  custom_game_name: string | null
  /** null or blank: the screen shows a nickname seeded by the id. */
  player_name: string | null
  score: number
  /** Already through preparePhoto() on the phone: the sources upload it as is. */
  photo: PreparedPhoto
  display_on_screen: boolean
  instagram_consent: boolean
  instagram_handle: string | null
  detected_game_id: string | null
  detected_score: number | null
}

export type ChangedTable = 'games' | 'scores' | 'settings'
