import { anonymousName } from './anonymous-name'
import type { NamedCharacter } from './anonymous-name'
import type { LeaderboardRow } from './types'

export type { NamedCharacter } from './anonymous-name'
export {
  anonymousName,
  normalizePlayerName,
  FALLBACK_CHARACTERS,
  CHARACTERS_BY_SLUG,
  CHARACTERS_BY_GAME_ID,
  gameSlugFromId,
} from './anonymous-name'

export interface DisplayedNameInput {
  scoreId: string
  /** Real name, or the seed that stands for it; null or blank when left empty. */
  playerName: string | null
  displayOnScreen: boolean
  gameId: string
  characters?: ReadonlyArray<NamedCharacter> | null
}

/**
 * The name a score shows. A displayed score with a name shows it. Otherwise
 * the nickname is seeded by the name (normalized, so the same player keeps
 * the same nickname on a game), or by the score id when the name is empty.
 */
export function displayedPlayerName({
  scoreId,
  playerName,
  displayOnScreen,
  gameId,
  characters,
}: DisplayedNameInput) {
  const name = playerName?.trim() || null
  if (displayOnScreen && name) return name
  return anonymousName({ playerName: name ?? scoreId, gameId, characters })
}

/**
 * Applied by every source before a row leaves it. The real backend must also
 * guarantee it on the server side (view or server function).
 */
export function toPublicRow(
  row: Omit<LeaderboardRow, 'anonymous' | 'player_name'> & {
    player_name: string | null
  },
  displayOnScreen: boolean,
  characters?: ReadonlyArray<NamedCharacter> | null,
): LeaderboardRow {
  const player_name = displayedPlayerName({
    scoreId: row.id,
    playerName: row.player_name,
    displayOnScreen,
    gameId: row.game_id,
    characters,
  })
  if (displayOnScreen) return { ...row, player_name, anonymous: false }
  return { ...row, player_name, photo_path: null, anonymous: true }
}
