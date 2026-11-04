import type {
  ChangedTable,
  DisplayedGame,
  GameRecord,
  LeaderboardRow,
  Settings,
  SubmissionInput,
} from './types'

export const DEFAULT_SETTINGS: Settings = {
  submissions_open: true,
  screen_mode: 'game',
  game_duration_s: 15,
  wall_duration_s: 20,
  rows_shown: 5,
}

/** Everything the public screen and the player form need, whatever the backend. */
export interface HighscoresSource {
  listVisibleGames: () => Promise<Array<DisplayedGame>>
  getLeaderboard: (
    gameId: string,
    limit: number,
  ) => Promise<Array<LeaderboardRow>>
  /** One entry per visible game, in display order. */
  listRecords: () => Promise<Array<GameRecord>>
  getSettings: () => Promise<Settings>
  submitScore: (input: SubmissionInput) => Promise<void>
  photoUrl: (path: string | null) => string | null
  /** Calls onChange whenever a table changes; returns the unsubscribe function. */
  subscribe: (onChange: (table: ChangedTable) => void) => () => void
}
