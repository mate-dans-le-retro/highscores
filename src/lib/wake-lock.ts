import { useEffect } from 'react'

/** Minimal surface used by the failsafe helpers (injectable in tests). */
export type WakeLockApi = {
  request: (type: 'screen') => Promise<WakeLockSentinel>
}

/**
 * Asks for a screen wake lock. Returns null when the API is missing, the
 * page is hidden, permission is denied, or the request fails for any reason.
 * The public screen keeps running either way.
 */
export async function acquireScreenWakeLock(
  api: WakeLockApi | null | undefined = defaultWakeLockApi(),
): Promise<WakeLockSentinel | null> {
  if (!api?.request) return null
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible')
    return null
  try {
    return await api.request('screen')
  } catch {
    return null
  }
}

/** Releases a sentinel; ignores missing locks and release errors. */
export async function releaseScreenWakeLock(
  sentinel: WakeLockSentinel | null | undefined,
): Promise<void> {
  if (!sentinel || sentinel.released) return
  try {
    await sentinel.release()
  } catch {
    // Failsafe: nothing to do if release fails.
  }
}

function defaultWakeLockApi(): WakeLockApi | null {
  if (typeof navigator === 'undefined') return null
  if (!('wakeLock' in navigator)) return null
  return navigator.wakeLock
}

/**
 * Keeps the projected public screen awake while the tab is visible.
 * Failsafe: missing API, denied permission or any error leaves the screen
 * running. Releases on unmount and re-acquires after the tab becomes visible
 * again (browsers drop the lock when the page is hidden).
 */
export function useScreenWakeLock() {
  useEffect(() => {
    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    const acquire = async () => {
      const next = await acquireScreenWakeLock()
      if (cancelled) {
        await releaseScreenWakeLock(next)
        return
      }
      await releaseScreenWakeLock(sentinel)
      sentinel = next
    }

    void acquire()

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void acquire()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      const current = sentinel
      sentinel = null
      void releaseScreenWakeLock(current)
    }
  }, [])
}
