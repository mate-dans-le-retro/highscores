import { pixelCaps } from '#/lib/highscores'
import { cn } from '#/lib/utils'

type PhotoPlaceholderProps = {
  /** The player kept the score off screen: masked bust, « Incognito ! ». */
  anonymous: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/** Player bust on a 16-unit grid (x, y, width, height): head, neck, shoulders. */
const BUST = [
  [6, 1, 4, 1],
  [5, 2, 6, 1],
  [4, 3, 8, 5],
  [5, 8, 6, 1],
  [6, 9, 4, 1],
  [7, 10, 2, 1],
  [4, 11, 8, 1],
  [2, 12, 12, 3],
] as const

/** Bandit mask over the eyes, wider than the head; the eyes are cut out of it. */
const MASK = [
  [3, 4, 10, 2],
  [13, 3, 1, 1],
  [13, 6, 1, 1],
] as const

const EYES = [
  [5, 5, 2, 1],
  [9, 5, 2, 1],
] as const

const SIZES = {
  sm: { art: 'size-20', caption: 'text-arcade-label' },
  md: { art: 'size-32', caption: 'text-arcade-title' },
  lg: { art: 'size-72', caption: 'text-scene-pixel' },
} as const

/**
 * Stand-in for a record photo: a pixel bust, masked for an anonymous score.
 * The pixel art is decorative; the caption says what it stands for.
 */
export function PhotoPlaceholder({
  anonymous,
  size = 'md',
  className,
}: PhotoPlaceholderProps) {
  const { art, caption } = SIZES[size]
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 text-center',
        className,
      )}
    >
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        focusable="false"
        shapeRendering="crispEdges"
        className={cn(art, 'shrink-0')}
      >
        {BUST.map(([x, y, width, height]) => (
          <rect
            key={`b-${x}-${y}`}
            x={x}
            y={y}
            width={width}
            height={height}
            className="fill-line-subtle"
          />
        ))}
        {(anonymous ? MASK : EYES).map(([x, y, width, height]) => (
          <rect
            key={`m-${x}-${y}`}
            x={x}
            y={y}
            width={width}
            height={height}
            className={anonymous ? 'fill-surface-accent' : 'fill-surface-base'}
          />
        ))}
        {anonymous
          ? EYES.map(([x, y, width, height]) => (
              <rect
                key={`e-${x}-${y}`}
                x={x}
                y={y}
                width={width}
                height={height}
                className="fill-surface-base"
              />
            ))
          : null}
      </svg>
      {size === 'sm' ? null : (
        <p className={cn('font-display text-ink-secondary', caption)}>
          {pixelCaps(anonymous ? 'Incognito !' : 'Sans photo')}
        </p>
      )}
    </div>
  )
}
