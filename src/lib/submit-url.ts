import { useEffect, useState } from 'react'

export type SubmitScoreUrlOptions = {
  /** When set, the form opens with that visible game already picked (changeable). */
  gameSlug?: string | null
}

/**
 * Where a QR code sends a phone: the player form on the current domain. The
 * demo keeps `?mock=1` so the phone stays on the demo data; the real backend
 * gets no mock parameter. A game slug becomes `?game=<slug>`.
 */
export function submitScoreUrl(
  origin: string,
  mock: boolean,
  options: SubmitScoreUrlOptions = {},
) {
  const url = new URL('/score', origin)
  if (mock) url.searchParams.set('mock', '1')
  if (options.gameSlug) url.searchParams.set('game', options.gameSlug)
  return url.href
}

/** Null until mounted: the origin is only known in the browser. */
export function useSubmitScoreUrl(
  mock: boolean,
  options: SubmitScoreUrlOptions = {},
) {
  const gameSlug = options.gameSlug ?? null
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    setUrl(submitScoreUrl(window.location.origin, mock, { gameSlug }))
  }, [mock, gameSlug])
  return url
}
