/** Connection state reported to the screen: live, or lost and retrying. */
export type ConnectionStatus = 'connected' | 'disconnected'

/** What one subscription attempt reports: it joined, or it dropped (error, timeout, close). */
export type AttemptStatus = 'joined' | 'lost'

/** The browser's online/offline signal, injectable for the tests. */
export interface NetworkSignal {
  readonly online: boolean
  addEventListener: (type: 'online' | 'offline', listener: () => void) => void
  removeEventListener: (
    type: 'online' | 'offline',
    listener: () => void,
  ) => void
}

export interface KeepSubscribedOptions {
  /** Opens one subscription attempt and returns the function that closes it. */
  open: (report: (status: AttemptStatus) => void) => () => void
  onStatus: (status: ConnectionStatus) => void
  /** Delay before retry number `attempt` (0 for the first retry). */
  backoffMs?: (attempt: number) => number
  network?: NetworkSignal | null
}

/** 1 s, 2 s, 4 s… capped at 30 s. */
export const reconnectDelayMs = (attempt: number) =>
  Math.min(30_000, 1_000 * 2 ** attempt)

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

/**
 * Keeps a subscription open: when an attempt drops, closes it and opens a new
 * one after a growing delay. While the browser says it is offline, waits for
 * the `online` event instead of retrying. Returns the function that stops it all.
 */
export function keepSubscribed({
  open,
  onStatus,
  backoffMs = reconnectDelayMs,
  network = browserNetwork(),
}: KeepSubscribedOptions): () => void {
  let attempt = 0
  let generation = 0
  let close: (() => void) | null = null
  let retry: ReturnType<typeof setTimeout> | null = null
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
    closeCurrent()
    const mine = generation
    const closeThis = open((report) => {
      if (mine !== generation) return
      if (report === 'joined') {
        attempt = 0
        emit('connected')
      } else {
        lose()
      }
    })
    if (mine === generation) close = closeThis
    else closeThis()
  }

  const lose = () => {
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

  network?.addEventListener('online', onOnline)
  network?.addEventListener('offline', lose)
  connect()

  return () => {
    network?.removeEventListener('online', onOnline)
    network?.removeEventListener('offline', lose)
    clearRetry()
    closeCurrent()
  }
}
