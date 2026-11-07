import { z } from 'zod'

import type { ScreenMode, Settings } from './data/types'

/** Whole number from the URL, clamped to [min, max]; anything else is ignored. */
const boundedInt = (min: number, max: number) =>
  z.coerce
    .number()
    .int()
    .transform((value) => Math.min(max, Math.max(min, value)))
    .optional()
    .catch(undefined)

const screenModeParam = z
  .enum(['game', 'wall', 'both'])
  .optional()
  .catch(undefined)

/** Non-empty slug from the URL; blank or missing values are ignored. */
const gameSlugParam = z.string().trim().min(1).optional().catch(undefined)

/**
 * Search params of the public screen, to override the settings on the fly:
 * `/?rotation=30`, `/?rows=10`, `/?minAllTime=5`, `/?header=1` (or 0),
 * `/?mode=wall`, `/?game=<slug>` (locked kiosk views).
 */
export const screenSearchSchema = z.object({
  rotation: boundedInt(5, 300),
  // The design system allows ten rows at most on the projected screen.
  rows: boundedInt(1, 10),
  minAllTime: boundedInt(1, 10),
  header: boundedInt(0, 1),
  /** Overrides admin `screen_mode`. `wall` also locks the display (no pills). */
  mode: screenModeParam,
  /**
   * Locks the public screen on this visible game slug (per-cabinet kiosk).
   * Ignored when `mode=wall`. Hides rotation pills; new-record takeovers only
   * fire for this game.
   */
  game: gameSlugParam,
})

export type ScreenSearch = z.infer<typeof screenSearchSchema>

export type ScreenDisplayOptions = {
  /** Kept for callers that only care about the per-game duration. */
  rotationMs: number
  gameDurationMs: number
  wallDurationMs: number
  newRecordDurationMs: number
  screenMode: ScreenMode
  /**
   * When set, the public screen shows only this game. Mutually exclusive with
   * a locked wall (`mode=wall` wins).
   */
  lockedGameSlug: string | undefined
  /**
   * True when the URL forces the wall (`mode=wall`) or a single game
   * (`game=<slug>`): no rotation thumbnails.
   */
  displayLocked: boolean
  rows: number
  minAllTimeRows: number
  showHeader: boolean
}

export function screenOptions(
  settings: Settings,
  search: ScreenSearch,
): ScreenDisplayOptions {
  const rows = search.rows ?? settings.rows_shown
  const minAllTimeRows = Math.min(
    rows,
    search.minAllTime ?? settings.min_all_time_rows,
  )
  const gameDurationMs = (search.rotation ?? settings.game_duration_s) * 1000
  const wallDurationMs = (search.rotation ?? settings.wall_duration_s) * 1000
  const newRecordDurationMs = settings.new_record_duration_s * 1000

  const lockedWall = search.mode === 'wall'
  const lockedGameSlug =
    !lockedWall && search.game !== undefined ? search.game : undefined
  const displayLocked = lockedWall || lockedGameSlug !== undefined

  const screenMode: ScreenMode = lockedWall
    ? 'wall'
    : lockedGameSlug !== undefined
      ? 'game'
      : (search.mode ?? settings.screen_mode)

  return {
    rotationMs: gameDurationMs,
    gameDurationMs,
    wallDurationMs,
    newRecordDurationMs,
    screenMode,
    lockedGameSlug,
    displayLocked,
    rows,
    minAllTimeRows,
    showHeader:
      search.header === undefined ? settings.show_header : search.header === 1,
  }
}
