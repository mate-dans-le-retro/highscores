export interface ReloadWhenReachableOptions {
  delayMs: number
  /** Wait between two checks while the site does not answer. */
  retryMs?: number
  isReachable?: () => Promise<boolean>
  reload?: () => void
}

/** True when the site answers at all: a 4xx still proves the network is back. */
export async function pageIsReachable() {
  if (!navigator.onLine) return false
  const response = await fetch(window.location.href, {
    method: 'HEAD',
    cache: 'no-store',
  })
  return response.status < 500
}

/**
 * Reloads the page after `delayMs`, but only once the site answers: reloading
 * while the network is down would leave the browser's error page on the
 * projector, and nothing would ever bring the screen back.
 * Returns the function that cancels it.
 */
export function reloadWhenReachable({
  delayMs,
  retryMs = 5_000,
  isReachable = pageIsReachable,
  reload = () => window.location.reload(),
}: ReloadWhenReachableOptions): () => void {
  let cancelled = false

  const check = async () => {
    const reachable = await isReachable().catch(() => false)
    if (cancelled) return
    if (reachable) reload()
    else timer = setTimeout(check, retryMs)
  }

  let timer = setTimeout(check, delayMs)

  return () => {
    cancelled = true
    clearTimeout(timer)
  }
}
