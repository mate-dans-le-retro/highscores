/**
 * Stub for game/score detection from the player's photo.
 * Returns nothing by default; a server function will replace this later.
 */
export interface PhotoDetection {
  gameId: string | null
  score: number | null
}

export async function detectFromPhoto(_photo: Blob): Promise<PhotoDetection> {
  return { gameId: null, score: null }
}
