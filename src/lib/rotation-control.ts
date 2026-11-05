/**
 * Where the public screen is in its rotation. `lap` is bumped to start the
 * current slide over (its timers and progress bar restart); `held` is the
 * pause set by a double click on a pill; `pending` covers the double-click
 * window after a first click, while we cannot tell a single click yet.
 */
export interface RotationState {
  index: number
  lap: number
  held: boolean
  pending: boolean
}

export const INITIAL_ROTATION: RotationState = {
  index: 0,
  lap: 0,
  held: false,
  pending: false,
}

/** Within this delay, a second click on a pill makes a double click. */
export const DOUBLE_CLICK_MS = 400

/**
 * A click on a pill. `clicks` is the click's `detail`: 2 for the second
 * click of a double click, 0 from the keyboard.
 *
 * - the slide changes at once;
 * - a second click within `DOUBLE_CLICK_MS` holds it;
 * - otherwise `settleClick()` starts it over (and ends a pause) once the
 *   window is over. Until then the bar stays hidden, so it never shows at
 *   zero before a pause hides it.
 */
export function clickPill(
  state: RotationState,
  target: number,
  clicks: number,
): RotationState {
  if (clicks >= 2)
    return { ...state, index: target, held: true, pending: false }
  return { ...state, index: target, pending: true }
}

/** The double-click window is over: it was a single click. */
export function settleClick(state: RotationState): RotationState {
  if (!state.pending) return state
  return { ...state, lap: state.lap + 1, held: false, pending: false }
}

/** A click on the pause button: the slide on screen, from zero. */
export function resume(state: RotationState): RotationState {
  if (!state.held) return state
  return { ...state, lap: state.lap + 1, held: false, pending: false }
}

/**
 * The bar is hidden while held (it would be useless) and during the
 * double-click window; the lap bumped when the rotation goes on brings it
 * back from zero.
 */
export function progressShown(state: RotationState, count: number): boolean {
  return count > 0 && !state.held && !state.pending
}

/** End of a slide's time: the next slide, or the same one over. */
export function advance(state: RotationState, count: number): RotationState {
  if (state.held || state.pending || count === 0) return state
  if (count === 1) return { ...state, lap: state.lap + 1 }
  return { ...state, index: (state.index + 1) % count }
}

/**
 * End of a "Nouveau record" takeover: the game of the record from the start
 * of its time, or, while held, back to the held slide, still held.
 */
export function afterCelebration(
  state: RotationState,
  recordSlide: number,
): RotationState {
  if (state.held) return state
  return {
    ...state,
    index: recordSlide >= 0 ? recordSlide : state.index,
    lap: state.lap + 1,
    pending: false,
  }
}
