import { describe, expect, it } from 'vitest'

import {
  INITIAL_ROTATION,
  advance,
  afterCelebration,
  clickPill,
  progressShown,
  resume,
  settleClick,
} from './rotation-control'
import type { RotationState } from './rotation-control'

const running: RotationState = { index: 2, lap: 5, held: false, pending: false }
const held: RotationState = { index: 2, lap: 5, held: true, pending: false }

describe('a single click on a pill', () => {
  it('changes slide at once, without restarting the bar yet', () => {
    const clicked = clickPill(running, 4, 1)
    expect(clicked).toEqual({ index: 4, lap: 5, held: false, pending: true })
    expect(progressShown(clicked, 7)).toBe(false)
  })

  it('starts the slide over once the double-click window is over', () => {
    const settled = settleClick(clickPill(running, 4, 1))
    expect(settled).toEqual({ index: 4, lap: 6, held: false, pending: false })
    expect(progressShown(settled, 7)).toBe(true)
  })

  it('restarts the current slide when its own pill is clicked', () => {
    expect(settleClick(clickPill(running, 2, 1))).toEqual({
      index: 2,
      lap: 6,
      held: false,
      pending: false,
    })
  })

  it('treats a keyboard press (detail 0) as a single click', () => {
    expect(settleClick(clickPill(running, 4, 0))).toMatchObject({
      index: 4,
      lap: 6,
      held: false,
    })
  })

  it('ends a pause, from zero, on the pill clicked', () => {
    const clicked = clickPill(held, 0, 1)
    expect(clicked).toMatchObject({ index: 0, held: true, pending: true })
    expect(settleClick(clicked)).toEqual({
      index: 0,
      lap: 6,
      held: false,
      pending: false,
    })
  })

  it('does nothing more when the window ends after a double click', () => {
    const holding = clickPill(clickPill(running, 4, 1), 4, 2)
    expect(settleClick(holding)).toBe(holding)
  })
})

describe('a double click on a pill', () => {
  it('holds the slide; the bar never restarts in between', () => {
    const first = clickPill(running, 4, 1)
    const second = clickPill(first, 4, 2)
    expect(second).toEqual({ index: 4, lap: 5, held: true, pending: false })
    expect(progressShown(first, 7)).toBe(false)
    expect(progressShown(second, 7)).toBe(false)
  })

  it('stays held when it lands while held', () => {
    const second = clickPill(clickPill(held, 4, 1), 4, 2)
    expect(second).toEqual({ index: 4, lap: 5, held: true, pending: false })
  })
})

describe('resume (pause button)', () => {
  it('resumes the slide on screen from zero', () => {
    const resumed = resume(held)
    expect(resumed).toEqual({ index: 2, lap: 6, held: false, pending: false })
    expect(progressShown(resumed, 7)).toBe(true)
  })

  it('does nothing when the rotation is not held', () => {
    expect(resume(running)).toBe(running)
  })
})

describe('progressShown', () => {
  it('shows the bar while the rotation runs', () => {
    expect(progressShown(running, 5)).toBe(true)
  })

  it('hides it while held, and when there is nothing to rotate', () => {
    expect(progressShown(held, 5)).toBe(false)
    expect(progressShown(running, 0)).toBe(false)
  })
})

describe('advance', () => {
  it('goes to the next slide, wrapping around', () => {
    expect(advance(running, 5)).toEqual({ ...running, index: 3 })
    expect(advance({ ...running, index: 4 }, 5).index).toBe(0)
  })

  it('starts a lone slide over', () => {
    expect(advance(INITIAL_ROTATION, 1)).toEqual({
      ...INITIAL_ROTATION,
      lap: 1,
    })
  })

  it('never moves while held or while a click is pending', () => {
    expect(advance(held, 5)).toBe(held)
    const pending = clickPill(running, 4, 1)
    expect(advance(pending, 5)).toBe(pending)
  })
})

describe('afterCelebration', () => {
  it('shows the game of the record from the start of its time', () => {
    expect(afterCelebration(running, 6)).toEqual({
      ...running,
      index: 6,
      lap: 6,
    })
  })

  it('stays on the current slide when the record game is not shown', () => {
    expect(afterCelebration(running, -1)).toEqual({ ...running, lap: 6 })
  })

  it('goes back to the held slide, still held', () => {
    expect(afterCelebration(held, 6)).toBe(held)
  })
})
