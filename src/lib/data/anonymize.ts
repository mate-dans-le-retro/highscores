import { anonymousName } from './anonymous-name'
import type { NamedCharacter } from './anonymous-name'
import type { LeaderboardRow } from './types'

export type { NamedCharacter } from './anonymous-name'
export {
  anonymousName,
  normalizePlayerName,
  FALLBACK_CHARACTERS,
  CHARACTERS_BY_GAME_ID,
} from './anonymous-name'

/**
 * Applied by every source before a row leaves it. The real backend must also
 * guarantee it on the server side (view or server function).
 */
export function toPublicRow(
  row: Omit<LeaderboardRow, 'anonymous'>,
  displayOnScreen: boolean,
  characters?: ReadonlyArray<NamedCharacter> | null,
): LeaderboardRow {
  if (displayOnScreen) return { ...row, anonymous: false }
  return {
    ...row,
    player_name: anonymousName({
      playerName: row.player_name,
      gameId: row.game_id,
      characters,
    }),
    photo_path: null,
    anonymous: true,
  }
}
