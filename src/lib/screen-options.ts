import { z } from 'zod'

import type { Settings } from './data/types'

/** Whole number from the URL, clamped to [min, max]; anything else is ignored. */
const boundedInt = (min: number, max: number) =>
  z.coerce
    .number()
    .int()
    .transform((value) => Math.min(max, Math.max(min, value)))
    .optional()
    .catch(undefined)

/**
 * Search params of the public screen, to override the settings on the fly:
 * `/?rotation=30`, `/?rows=10`, `/?minAllTime=5`.
 */
export const screenSearchSchema = z.object({
  rotation: boundedInt(5, 300),
  // The design system allows ten rows at most on the projected screen.
  rows: boundedInt(1, 10),
  minAllTime: boundedInt(1, 10),
})

export type ScreenSearch = z.infer<typeof screenSearchSchema>

export function screenOptions(settings: Settings, search: ScreenSearch) {
  const rows = search.rows ?? settings.rows_shown
  const minAllTimeRows = Math.min(
    rows,
    search.minAllTime ?? settings.min_all_time_rows,
  )
  const gameDurationMs = (search.rotation ?? settings.game_duration_s) * 1000
  const wallDurationMs = (search.rotation ?? settings.wall_duration_s) * 1000
  return {
    /** Kept for callers that only care about the per-game duration. */
    rotationMs: gameDurationMs,
    gameDurationMs,
    wallDurationMs,
    screenMode: settings.screen_mode,
    rows,
    minAllTimeRows,
  }
}
