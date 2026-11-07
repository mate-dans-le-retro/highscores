/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ChangedTable } from './data/types'
import type { ConnectionStatus } from './data/realtime-connection'

type StatusListener = (status: ConnectionStatus) => void
type ChangeListener = (table: ChangedTable) => void

const fake = vi.hoisted(() => {
  const listeners = {
    onChange: null as ChangeListener | null,
    onStatus: null as StatusListener | null,
  }
  const reload = {
    calls: [] as Array<{ delayMs: number }>,
    cancel: vi.fn(),
  }
  return {
    listeners,
    reload,
    subscribe: vi.fn((onChange: ChangeListener, onStatus?: StatusListener) => {
      listeners.onChange = onChange
      listeners.onStatus = onStatus ?? null
      return () => {
        listeners.onChange = null
        listeners.onStatus = null
      }
    }),
  }
})

vi.mock('./data', () => ({
  isMock: false,
  source: {
    subscribe: fake.subscribe,
  },
}))

vi.mock('./reload-when-reachable', () => ({
  reloadWhenReachable: (options: { delayMs: number }) => {
    fake.reload.calls.push({ delayMs: options.delayMs })
    return fake.reload.cancel
  },
}))

const { useHighscoresRealtime } = await import('./highscores')

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return {
    client,
    Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      )
    },
  }
}

describe('useHighscoresRealtime', () => {
  beforeEach(() => {
    fake.listeners.onChange = null
    fake.listeners.onStatus = null
    fake.reload.calls = []
    fake.reload.cancel.mockClear()
    fake.subscribe.mockClear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('tracks connection status from the data source', () => {
    const { Wrapper } = wrapper()
    const { result } = renderHook(() => useHighscoresRealtime(), {
      wrapper: Wrapper,
    })

    expect(result.current).toBe('disconnected')

    act(() => {
      fake.listeners.onStatus?.('connected')
    })
    expect(result.current).toBe('connected')

    act(() => {
      fake.listeners.onStatus?.('disconnected')
    })
    expect(result.current).toBe('disconnected')
  })

  it('invalidates the matching query keys when a table changes', async () => {
    const { client, Wrapper } = wrapper()
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    renderHook(() => useHighscoresRealtime(), { wrapper: Wrapper })

    act(() => {
      fake.listeners.onChange?.('scores')
    })

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['leaderboard'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['records'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['pending'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['admin'] })
  })

  it('schedules a public reload while disconnected and cancels it on reconnect', async () => {
    const { client, Wrapper } = wrapper()
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    renderHook(
      () => useHighscoresRealtime({ reloadAfterMs: 60_000 }),
      { wrapper: Wrapper },
    )

    act(() => {
      fake.listeners.onStatus?.('disconnected')
    })
    expect(fake.reload.calls).toEqual([{ delayMs: 60_000 }])

    act(() => {
      fake.listeners.onStatus?.('connected')
    })
    expect(fake.reload.cancel).toHaveBeenCalledTimes(1)
    expect(invalidate).toHaveBeenCalledWith()
  })

  it('warns once after warnAfterMs while still disconnected', async () => {
    const onDisconnectedTooLong = vi.fn()
    const { Wrapper } = wrapper()
    renderHook(
      () =>
        useHighscoresRealtime({
          warnAfterMs: 60_000,
          onDisconnectedTooLong,
        }),
      { wrapper: Wrapper },
    )

    act(() => {
      fake.listeners.onStatus?.('disconnected')
    })
    expect(onDisconnectedTooLong).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(onDisconnectedTooLong).toHaveBeenCalledTimes(1)

    act(() => {
      fake.listeners.onStatus?.('disconnected')
      vi.advanceTimersByTime(60_000)
    })
    expect(onDisconnectedTooLong).toHaveBeenCalledTimes(1)
  })

  it('unsubscribes on unmount', () => {
    const { Wrapper } = wrapper()
    const { unmount } = renderHook(() => useHighscoresRealtime(), {
      wrapper: Wrapper,
    })
    expect(fake.listeners.onStatus).not.toBeNull()
    unmount()
    expect(fake.listeners.onStatus).toBeNull()
  })
})
