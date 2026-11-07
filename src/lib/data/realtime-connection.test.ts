import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  keepSubscribed,
  REALTIME_FRESHNESS_MS,
  reconnectDelayMs,
} from './realtime-connection'
import type {
  AttemptReport,
  ConnectionStatus,
  NetworkSignal,
  PageSignal,
} from './realtime-connection'

/** Records every attempt so a test can make it join or drop. */
function fakeChannels() {
  const attempts: Array<{
    report: (status: AttemptReport) => void
    closed: boolean
  }> = []
  const open = (report: (status: AttemptReport) => void) => {
    const attempt = { report, closed: false }
    attempts.push(attempt)
    return () => {
      attempt.closed = true
      // Like supabase.removeChannel(), closing reports CLOSED.
      report('lost')
    }
  }
  return { attempts, open, last: () => attempts[attempts.length - 1] }
}

function fakeNetwork() {
  const listeners = {
    online: new Set<() => void>(),
    offline: new Set<() => void>(),
  }
  const network: NetworkSignal & {
    go: (online: boolean) => void
    online: boolean
  } = {
    online: true,
    addEventListener: (type, listener) => listeners[type].add(listener),
    removeEventListener: (type, listener) => listeners[type].delete(listener),
    go(online) {
      network.online = online
      listeners[online ? 'online' : 'offline'].forEach((listener) => listener())
    },
  }
  return { network, listeners }
}

function fakePage() {
  const listeners = new Set<() => void>()
  const page: PageSignal & { resume: () => void } = {
    addEventListener: (_type, listener) => listeners.add(listener),
    removeEventListener: (_type, listener) => listeners.delete(listener),
    resume() {
      listeners.forEach((listener) => listener())
    },
  }
  return { page, listeners }
}

describe('reconnectDelayMs', () => {
  it('doubles from 1 s and stops at 30 s', () => {
    expect([0, 1, 2, 3, 4, 5, 9].map(reconnectDelayMs)).toEqual([
      1_000, 2_000, 4_000, 8_000, 16_000, 30_000, 30_000,
    ])
  })
})

describe('keepSubscribed', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  function setup(freshnessMs?: number) {
    const channels = fakeChannels()
    const { network, listeners } = fakeNetwork()
    const { page, listeners: pageListeners } = fakePage()
    const statuses: Array<ConnectionStatus> = []
    const stop = keepSubscribed({
      open: channels.open,
      onStatus: (status) => statuses.push(status),
      network,
      page,
      freshnessMs,
    })
    return { channels, network, listeners, page, pageListeners, statuses, stop }
  }

  it('reports connected once the first attempt joins', () => {
    const { channels, statuses } = setup()
    expect(channels.attempts).toHaveLength(1)
    channels.last().report('joined')
    expect(statuses).toEqual(['connected'])
  })

  it('closes a dropped attempt and opens a new one after the backoff', () => {
    const { channels, statuses } = setup()
    channels.last().report('joined')
    channels.last().report('lost')
    expect(statuses).toEqual(['connected', 'disconnected'])
    expect(channels.attempts[0].closed).toBe(true)

    vi.advanceTimersByTime(999)
    expect(channels.attempts).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(channels.attempts).toHaveLength(2)

    channels.last().report('joined')
    expect(statuses).toEqual(['connected', 'disconnected', 'connected'])
  })

  it('waits longer after each failed retry, and starts over once joined', () => {
    const { channels } = setup()
    channels.last().report('lost')
    vi.advanceTimersByTime(1_000)
    channels.last().report('lost')
    vi.advanceTimersByTime(1_999)
    expect(channels.attempts).toHaveLength(2)
    vi.advanceTimersByTime(1)
    expect(channels.attempts).toHaveLength(3)

    channels.last().report('joined')
    channels.last().report('lost')
    vi.advanceTimersByTime(1_000)
    expect(channels.attempts).toHaveLength(4)
  })

  it('ignores the reports of an attempt it already replaced', () => {
    const { channels, statuses } = setup()
    const first = channels.last()
    first.report('lost')
    vi.advanceTimersByTime(1_000)
    first.report('joined')
    first.report('lost')
    expect(statuses).toEqual(['disconnected'])
    expect(channels.attempts).toHaveLength(2)
  })

  it('handles an attempt that fails before open() returns', () => {
    const statuses: Array<ConnectionStatus> = []
    let opened = 0
    const closed: Array<number> = []
    const stop = keepSubscribed({
      open: (report) => {
        const id = ++opened
        if (id === 1) report('lost')
        else report('joined')
        return () => closed.push(id)
      },
      onStatus: (status) => statuses.push(status),
      network: null,
      page: null,
    })
    expect(closed).toEqual([1])
    vi.advanceTimersByTime(1_000)
    expect(statuses).toEqual(['disconnected', 'connected'])
    stop()
    expect(closed).toEqual([1, 2])
  })

  it('goes disconnected when the browser goes offline, and waits for online', () => {
    const { channels, network, statuses } = setup()
    channels.last().report('joined')
    network.go(false)
    expect(statuses).toEqual(['connected', 'disconnected'])
    expect(channels.attempts[0].closed).toBe(true)

    vi.advanceTimersByTime(60_000)
    expect(channels.attempts).toHaveLength(1)

    network.go(true)
    expect(channels.attempts).toHaveLength(2)
    channels.last().report('joined')
    expect(statuses).toEqual(['connected', 'disconnected', 'connected'])
  })

  it('retries at once when the browser comes back online', () => {
    const { channels, network } = setup()
    channels.last().report('lost')
    vi.advanceTimersByTime(1_000)
    channels.last().report('lost')
    network.go(true)
    expect(channels.attempts).toHaveLength(3)
    // The pending 2 s retry was dropped for the immediate one.
    vi.advanceTimersByTime(2_000)
    expect(channels.attempts).toHaveLength(3)
  })

  it('leaves a live connection alone on a stray online event', () => {
    const { channels, network } = setup()
    channels.last().report('joined')
    network.go(true)
    expect(channels.attempts).toHaveLength(1)
  })

  it('stops everything when unsubscribed', () => {
    const { channels, listeners, pageListeners, statuses, stop } = setup()
    channels.last().report('lost')
    stop()
    vi.advanceTimersByTime(60_000)
    expect(channels.attempts).toHaveLength(1)
    expect(listeners.online.size).toBe(0)
    expect(listeners.offline.size).toBe(0)
    expect(pageListeners.size).toBe(0)
    expect(statuses).toEqual(['disconnected'])
  })

  it('resubscribes on tab resume without marking lost while the rejoin is pending', () => {
    const { channels, page, statuses } = setup()
    channels.last().report('joined')
    page.resume()
    expect(statuses).toEqual(['connected'])
    expect(channels.attempts[0].closed).toBe(true)
    expect(channels.attempts).toHaveLength(2)
    channels.last().report('joined')
    expect(statuses).toEqual(['connected'])
  })

  it('marks disconnected on resume only if the rejoin fails', () => {
    const { channels, page, statuses } = setup()
    channels.last().report('joined')
    page.resume()
    channels.last().report('lost')
    expect(statuses).toEqual(['connected', 'disconnected'])
    expect(channels.attempts[1].closed).toBe(true)
  })

  it('marks disconnected on resume when the browser is offline', () => {
    const { channels, network, page, statuses } = setup()
    channels.last().report('joined')
    network.online = false
    page.resume()
    expect(statuses).toEqual(['connected', 'disconnected'])
    expect(channels.attempts).toHaveLength(1)
  })

  it('forces disconnected when connected with no activity for freshnessMs', () => {
    const { channels, statuses } = setup(REALTIME_FRESHNESS_MS)
    channels.last().report('joined')
    vi.advanceTimersByTime(REALTIME_FRESHNESS_MS - 1)
    expect(statuses).toEqual(['connected'])
    vi.advanceTimersByTime(1)
    expect(statuses).toEqual(['connected', 'disconnected'])
    expect(channels.attempts[0].closed).toBe(true)
  })

  it('resets the freshness timer on realtime activity', () => {
    const { channels, statuses } = setup(REALTIME_FRESHNESS_MS)
    channels.last().report('joined')
    vi.advanceTimersByTime(REALTIME_FRESHNESS_MS - 1)
    channels.last().report('activity')
    vi.advanceTimersByTime(REALTIME_FRESHNESS_MS - 1)
    expect(statuses).toEqual(['connected'])
    vi.advanceTimersByTime(1)
    expect(statuses).toEqual(['connected', 'disconnected'])
  })
})
