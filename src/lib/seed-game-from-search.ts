import type { ScoreDraft } from './score-draft'
import { findGameIdBySlug } from './score-step'

/**
 * Seeds the draft's game from `?game=<slug>`. A different visible slug wins
 * over a previous pick or "Un autre jeu" (QR at another station). Same slug
 * or an unknown one leaves the draft unchanged.
 */
export function seedGameFromSearch(
  draft: ScoreDraft,
  games: Array<{ id: string; slug: string }>,
  gameSlug: string | undefined,
): ScoreDraft | null {
  const gameId = findGameIdBySlug(games, gameSlug)
  if (!gameId) return null
  if (
    !draft.customGame &&
    draft.gameId === gameId &&
    draft.customGameName === null
  ) {
    return null
  }
  return {
    ...draft,
    gameId,
    customGame: false,
    customGameName: null,
  }
}
