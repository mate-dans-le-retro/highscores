import { useEffect, useState } from 'react'

/**
 * Where a QR code sends a phone: the player form on the current domain. The
 * demo keeps `?mock=1` so the phone stays on the demo data; the real backend
 * gets no parameter at all.
 */
export function submitScoreUrl(origin: string, mock: boolean) {
  const url = new URL('/score', origin)
  if (mock) url.searchParams.set('mock', '1')
  return url.href
}

/** Null until mounted: the origin is only known in the browser. */
export function useSubmitScoreUrl(mock: boolean) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    setUrl(submitScoreUrl(window.location.origin, mock))
  }, [mock])
  return url
}
