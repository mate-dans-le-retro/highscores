/** Connection state reported to the screen: live, or lost and retrying. */
export type ConnectionStatus = 'connected' | 'disconnected'

/** What one subscription attempt reports: it joined, or it dropped (error, timeout, close). */
export type AttemptStatus = 'joined' | 'lost'

/**
 * Attempt reports plus `activity` when a realtime payload arrives (resets the
 * freshness watchdog without changing connection status).
 */
export type AttemptReport = AttemptStatus | 'activity'

/** The browser's online/offline signal, injectable for the tests. */
export interface NetworkSignal {
  readonly online: boolean
  addEventListener: (type: 'online' | 'offline', listener: () => void) => void
  removeEventListener: (
    type: 'online' | 'offline',
    listener: () => void,
  ) => void
}

/**
 * Tab / window resume signal: after background, lock screen or another app,
 * the Realtime socket may be dead without a channel error.
 */
export interface PageSignal {
  addEventListener: (type: 'resume', listener: () => void) => void
  removeEventListener: (type: 'resume', listener: () => void) => void
}

export interface KeepSubscribedOptions {
  /** Opens one subscription attempt and returns the function that closes it. */
  open: (report: (status: AttemptReport) => void) => () => void
  onStatus: (status: ConnectionStatus) => void
  /** Delay before retry number `attempt` (0 for the first retry). */
  backoffMs?: (attempt: number) => number
  network?: NetworkSignal | null
  page?: PageSignal | null
  /**
   * While connected, if no join or realtime activity arrives for this long,
   * treat the channel as a zombie and force `disconnected` so poll starts.
   * Omit or pass `0` to disable.
   */
  freshnessMs?: number
}

/** 1 s, 2 s, 4 s… capped at 30 s. */
export const reconnectDelayMs = (attempt: number) =>
  Math.min(30_000, 1_000 * 2 ** attempt)

/**
 * Quiet connected channel with no change_signals for this long → force
 * disconnected (zombie socket without CHANNEL_ERROR). Three minutes: long
 * enough for a quiet hall, short enough to heal a projector that never
 * sees visibilitychange.
 */
export const REALTIME_FRESHNESS_MS = 180_000

export function browserNetwork(): NetworkSignal | null {
  if (typeof window === 'undefined') return null
  return {
    get online() {
      return navigator.onLine
    },
    addEventListener: (type, listener) =>
      window.addEventListener(type, listener),
    removeEventListener: (type, listener) =>
      window.removeEventListener(type, listener),
  }
}

export function browserPage(): PageSignal | null {
  if (typeof window === 'undefined' || typeof document === 'undefined')
    return null

  const listeners = new Set<() => void>()
  const emit = () => {
    if (document.visibilityState === 'hidden') return
    listeners.forEach((listener) => listener())
  }
  const onVisibility = () => {
    if (document.visibilityState === 'visible') emit()
  }

  return {
    addEventListener: (_type, listener) => {
      if (listeners.size === 0) {
        document.addEventListener('visibilitychange', onVisibility)
        window.addEventListener('focus', emit)
      }
      listeners.add(listener)
    },
    removeEventListener: (_type, listener) => {
      listeners.delete(listener)
      if (listeners.size === 0) {
        document.removeEventListener('visibilitychange', onVisibility)
        window.removeEventListener('focus', emit)
      }
    },
  }
}

/**
 * Keeps a subscription open: when an attempt drops, closes it and opens a new
 * one after a growing delay. While the browser says it is offline, waits for
 * the `online` event instead of retrying. On tab resume (visible / focus),
 * resubscribes immediately to heal zombie sockets without marking disconnected
 * unless the new attempt fails. While connected, a freshness timer forces
 * disconnected if no join/activity arrives. Returns the stop function.
 */
export function keepSubscribed({
  open,
  onStatus,
  backoffMs = reconnectDelayMs,
  network = browserNetwork(),
  page = browserPage(),
  freshnessMs,
}: KeepSubscribedOptions): () => void {
  let attempt = 0
  let generation = 0
  let close: (() => void) | null = null
  let retry: ReturnType<typeof setTimeout> | null = null
  let freshness: ReturnType<typeof setTimeout> | null = null
  let status: ConnectionStatus | null = null

  const emit = (next: ConnectionStatus) => {
    if (next === status) return
    status = next
    onStatus(next)
  }

  const clearRetry = () => {
    if (retry === null) return
    clearTimeout(retry)
    retry = null
  }

  const clearFreshness = () => {
    if (freshness === null) return
    clearTimeout(freshness)
    freshness = null
  }

  const armFreshness = () => {
    clearFreshness()
    if (!freshnessMs) return
    freshness = setTimeout(() => {
      freshness = null
      if (status === 'connected') lose()
    }, freshnessMs)
  }

  // Bumping the generation first silences the reports of the attempt being
  // closed (removing a Supabase channel reports CLOSED).
  const closeCurrent = () => {
    generation += 1
    const closing = close
    close = null
    closing?.()
  }

  const connect = () => {
    clearRetry()
    // Soft rejoin (resume / freshness retry): drop the previous timer so it
    // cannot force disconnected while the new handshake is in flight.
    clearFreshness()
    closeCurrent()
    const mine = generation
    const closeThis = open((report) => {
      if (mine !== generation) return
      if (report === 'joined') {
        attempt = 0
        emit('connected')
        armFreshness()
      } else if (report === 'activity') {
        if (status === 'connected') armFreshness()
      } else {
        lose()
      }
    })
    if (mine === generation) close = closeThis
    else closeThis()
  }

  const lose = () => {
    clearFreshness()
    emit('disconnected')
    closeCurrent()
    clearRetry()
    if (network && !network.online) return
    retry = setTimeout(connect, backoffMs(attempt))
    attempt += 1
  }

  const onOnline = () => {
    if (status === 'connected') return
    attempt = 0
    connect()
  }

  // Phone locked, tab backgrounded, then reopened: socket may be dead without
  // CHANNEL_ERROR. Soft-resubscribe; only mark disconnected if the rejoin fails
  // (or the browser is offline).
  const onResume = () => {
    attempt = 0
    if (network && !network.online) {
      clearFreshness()
      emit('disconnected')
      return
    }
    connect()
  }

  network?.addEventListener('online', onOnline)
  network?.addEventListener('offline', lose)
  page?.addEventListener('resume', onResume)
  connect()

  return () => {
    network?.removeEventListener('online', onOnline)
    network?.removeEventListener('offline', lose)
    page?.removeEventListener('resume', onResume)
    clearRetry()
    clearFreshness()
    closeCurrent()
  }
}
