import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { keepSubscribed, reconnectDelayMs } from './realtime-connection'
import type {
  AttemptStatus,
  ConnectionStatus,
  NetworkSignal,
} from './realtime-connection'

/** Records every attempt so a test can make it join or drop. */
function fakeChannels() {
  const attempts: Array<{
    report: (status: AttemptStatus) => void
    closed: boolean
  }> = []
  const open = (report: (status: AttemptStatus) => void) => {
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

  function setup() {
    const channels = fakeChannels()
    const { network, listeners } = fakeNetwork()
    const statuses: Array<ConnectionStatus> = []
    const stop = keepSubscribed({
      open: channels.open,
      onStatus: (status) => statuses.push(status),
      network,
    })
    return { channels, network, listeners, statuses, stop }
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
    const { channels, listeners, statuses, stop } = setup()
    channels.last().report('lost')
    stop()
    vi.advanceTimersByTime(60_000)
    expect(channels.attempts).toHaveLength(1)
    expect(listeners.online.size).toBe(0)
    expect(listeners.offline.size).toBe(0)
    expect(statuses).toEqual(['disconnected'])
  })
})
