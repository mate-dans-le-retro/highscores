/**
 * Exactly one of `game_id` or a custom game name must be set (XOR of
 * presence). Blank custom names count as absent after trim.
 */
export function hasExclusiveGameChoice(
  gameId: string | null | undefined,
  customGameName: string | null | undefined,
): boolean {
  const hasGameId = Boolean(gameId)
  const hasCustomName = Boolean(customGameName?.trim())
  return hasGameId !== hasCustomName
}
