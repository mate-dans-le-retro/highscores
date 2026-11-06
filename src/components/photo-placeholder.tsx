import { pixelCaps } from '#/lib/highscores'
import { BUST, EYES, MASK } from '#/lib/pixel-art'
import { cn } from '#/lib/utils'

type PhotoPlaceholderProps = {
  /** The player kept the score off screen: masked bust, « Incognito ! ». */
  anonymous: boolean
  /** `xs` and `sm` drop the caption (tight cells); the parent sets aria-label. */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  xs: { art: 'size-8', caption: 'text-arcade-label' },
  sm: { art: 'size-20', caption: 'text-arcade-label' },
  md: { art: 'size-32', caption: 'text-scene-pixel' },
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
  const showCaption = size !== 'xs' && size !== 'sm'
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
      {showCaption ? (
        <p className={cn('font-display text-ink-secondary', caption)}>
          {pixelCaps(anonymous ? 'Incognito !' : 'Sans photo')}
        </p>
      ) : null}
    </div>
  )
}
