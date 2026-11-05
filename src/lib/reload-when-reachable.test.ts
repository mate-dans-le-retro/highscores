import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { reloadWhenReachable } from './reload-when-reachable'

describe('reloadWhenReachable', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('reloads after the delay when the site answers', async () => {
    const reload = vi.fn()
    reloadWhenReachable({
      delayMs: 60_000,
      isReachable: () => Promise.resolve(true),
      reload,
    })
    await vi.advanceTimersByTimeAsync(59_999)
    expect(reload).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(reload).toHaveBeenCalledOnce()
  })

  it('keeps checking while the site does not answer', async () => {
    const reload = vi.fn()
    const answers = [
      () => Promise.resolve(false),
      () => Promise.reject(new Error('offline')),
    ]
    const isReachable = vi.fn(
      () => answers.shift()?.() ?? Promise.resolve(true),
    )
    reloadWhenReachable({
      delayMs: 60_000,
      retryMs: 5_000,
      isReachable,
      reload,
    })

    await vi.advanceTimersByTimeAsync(60_000)
    expect(reload).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(5_000)
    expect(reload).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(5_000)
    expect(isReachable).toHaveBeenCalledTimes(3)
    expect(reload).toHaveBeenCalledOnce()
  })

  it('does nothing once cancelled', async () => {
    const reload = vi.fn()
    const cancel = reloadWhenReachable({
      delayMs: 60_000,
      isReachable: () => Promise.resolve(true),
      reload,
    })
    await vi.advanceTimersByTimeAsync(30_000)
    cancel()
    await vi.advanceTimersByTimeAsync(120_000)
    expect(reload).not.toHaveBeenCalled()
  })

  it('does not reload when cancelled during a check', async () => {
    const reload = vi.fn()
    let answer: (reachable: boolean) => void = () => {}
    const cancel = reloadWhenReachable({
      delayMs: 1_000,
      isReachable: () => new Promise((resolve) => (answer = resolve)),
      reload,
    })
    await vi.advanceTimersByTimeAsync(1_000)
    cancel()
    answer(true)
    await vi.advanceTimersByTimeAsync(0)
    expect(reload).not.toHaveBeenCalled()
  })
})
