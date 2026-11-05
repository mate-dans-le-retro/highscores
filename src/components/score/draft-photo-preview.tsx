import { ImageOff } from 'lucide-react'
import { useState } from 'react'

import { cn } from '#/lib/utils'

type DraftPhotoPreviewProps = {
  url: string | null
  alt: string
  className?: string
}

/**
 * A HEIC kept as is (rare: the converter failed) has no preview outside
 * Safari, but it is still sent: the volunteers convert it on their side.
 */
export function DraftPhotoPreview({
  url,
  alt,
  className,
}: DraftPhotoPreviewProps) {
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null)
  if (!url) return null
  if (brokenUrl === url)
    return (
      <div
        className={cn(
          'flex size-full items-center justify-center text-ink-secondary',
          className,
        )}
      >
        <ImageOff className="size-6" aria-label="Photo prête, sans aperçu" />
      </div>
    )
  return (
    <img
      src={url}
      alt={alt}
      className={cn('size-full object-cover', className)}
      onError={() => setBrokenUrl(url)}
    />
  )
}
