import { cn } from '#/lib/utils'

const DEFAULT_SRC = '/mdlr-logo.svg'

type LogoProps = {
  /** Product-provided asset URL. Defaults to the public lockup. */
  src?: string
  /** Empty when the association name is already nearby in text. */
  alt?: string
  /** 3° tilt of the website header — not for app bars. */
  tilted?: boolean
  className?: string
}

/**
 * Full MDLR lockup. Do not recolour, filter, or recompose the mark.
 * Keep at least 160px wide so the RÉTRO pixel block stays sharp.
 */
export function Logo({
  src = DEFAULT_SRC,
  alt = 'Mate Dans Le Rétro… Gaming',
  tilted = false,
  className,
}: LogoProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={240}
      height={96}
      className={cn(
        'm-6 h-auto w-60 min-w-40 object-contain',
        tilted && '-rotate-3',
        className,
      )}
    />
  )
}
