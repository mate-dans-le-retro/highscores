import { cn } from '#/lib/utils'

type GameThumbProps = {
  name: string
  shortLabel: string
  coverPath: string | null
  active?: boolean
  className?: string
}

/**
 * Cover image for a game tile, or the trigramme fallback when none is set.
 */
export function GameThumb({
  name,
  shortLabel,
  coverPath,
  active = false,
  className,
}: GameThumbProps) {
  return (
    <span
      className={cn(
        'inline-flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-none border-4 bg-surface-inverse font-display text-arcade-label text-ink-inverse',
        active ? 'border-line-accent shadow-pixel' : 'border-surface-sunken',
        className,
      )}
      title={name}
    >
      {coverPath ? (
        <img
          src={coverPath}
          alt=""
          className="size-full object-cover"
          draggable={false}
        />
      ) : (
        <span aria-hidden="true">{shortLabel}</span>
      )}
    </span>
  )
}
