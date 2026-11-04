import type { LeaderboardRow } from './types'

/** Nicknames shown instead of the player's name; the same score always gets the same one. */
export const ANONYMOUS_NAMES = [
  'Un Mario anonyme',
  'Un Sonic masqué',
  'Un Link incognito',
  'Un Pac-Man discret',
  'Un Kirby mystère',
  'Un Donkey Kong timide',
  'Une Samus sous cape',
  'Un Yoshi en planque',
  'Un Bomberman camouflé',
  'Un Pikachu sans nom',
]

export function anonymousName(scoreId: string) {
  let hash = 0
  for (const char of scoreId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return ANONYMOUS_NAMES[hash % ANONYMOUS_NAMES.length]
}

/**
 * Applied by every source before a row leaves it. The real backend must also
 * guarantee it on the server side (view or server function).
 */
export function toPublicRow(
  row: Omit<LeaderboardRow, 'anonymous'>,
  displayOnScreen: boolean,
): LeaderboardRow {
  if (displayOnScreen) return { ...row, anonymous: false }
  return {
    ...row,
    player_name: anonymousName(row.id),
    photo_path: null,
    anonymous: true,
  }
}
