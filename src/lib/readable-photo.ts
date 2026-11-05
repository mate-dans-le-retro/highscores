import { useEffect, useState } from 'react'

import { displayablePhotoUrl } from './data/photo'

const HEIF_PATH = /\.(heic|heif|hif)(\?|#|$)/i

export function isHeifPath(url: string) {
  return HEIF_PATH.test(url)
}

/**
 * Image source for a stored photo. Phones send JPEGs, but a HEIC the phone
 * could not convert is kept as is: Chrome cannot show it, so it is converted
 * here, in the volunteer's browser. Falls back to the original URL.
 */
export function useReadablePhotoUrl(url: string | null) {
  const [converted, setConverted] = useState<{
    from: string
    to: string
  } | null>(null)

  useEffect(() => {
    if (!url || !isHeifPath(url)) return
    let cancelled = false
    let objectUrl: string | null = null
    void fetch(url)
      .then((response) => (response.ok ? response.blob() : null))
      .then((blob) => (blob ? displayablePhotoUrl(blob) : null))
      .catch(() => null)
      .then((result) => {
        objectUrl = result
        if (cancelled) {
          if (result) URL.revokeObjectURL(result)
          return
        }
        setConverted({ from: url, to: result ?? url })
      })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url])

  if (!url || !isHeifPath(url)) return url
  return converted?.from === url ? converted.to : null
}
