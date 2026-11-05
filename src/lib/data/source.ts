import type { ConnectionStatus } from './realtime-connection'
import type { ScreenLeaderboard } from './screen-leaderboard'
import type {
  ChangedTable,
  DisplayedGame,
  GameRecord,
  Settings,
  SubmissionInput,
} from './types'

export const DEFAULT_SETTINGS: Settings = {
  submissions_open: true,
  screen_mode: 'game',
  game_duration_s: 15,
  wall_duration_s: 20,
  rows_shown: 10,
  min_all_time_rows: 5,
  show_header: false,
}

export interface LeaderboardQueryOptions {
  /** N: total slots (`rows_shown`). */
  rows?: number
  /** M: floor for the all-time block (`min_all_time_rows`). */
  minAllTimeRows?: number
}

/** Everything the public screen and the player form need, whatever the backend. */
export interface HighscoresSource {
  listVisibleGames: () => Promise<Array<DisplayedGame>>
  getLeaderboard: (
    gameId: string,
    options?: LeaderboardQueryOptions,
  ) => Promise<ScreenLeaderboard>
  /** One entry per visible game, in display order. */
  listRecords: () => Promise<Array<GameRecord>>
  getSettings: () => Promise<Settings>
  submitScore: (input: SubmissionInput) => Promise<void>
  photoUrl: (path: string | null) => string | null
  /**
   * Calls onChange whenever a table changes, and onStatus when the live
   * connection drops or comes back. Returns the unsubscribe function.
   */
  subscribe: (
    onChange: (table: ChangedTable) => void,
    onStatus?: (status: ConnectionStatus) => void,
  ) => () => void
}
