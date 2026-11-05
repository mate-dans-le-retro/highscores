import { cn } from '#/lib/utils'

type RankBadgeSize = 'xs' | 'sm' | 'md' | 'lg'

type RankBadgeProps = {
  rank: number
  size?: RankBadgeSize
  /** Skip the coloured plate (e.g. on a podium step that already carries the metal). */
  bare?: boolean
  /** Numbered square even for ranks 1–3: cups are kept for the podium. */
  plain?: boolean
  /** Replaces the default accessible name (« 1re place »). */
  label?: string
  className?: string
}

const SIZES: Record<RankBadgeSize, string> = {
  xs: 'size-7 text-[10px]',
  sm: 'size-10 text-xs',
  md: 'size-12 text-sm',
  lg: 'size-20 text-lg',
}

const METALS = {
  1: {
    plate:
      'bg-[linear-gradient(155deg,var(--rank-gold-hi)_0%,var(--rank-gold)_62%)]',
    number: 'text-rank-gold',
  },
  2: {
    plate:
      'bg-[linear-gradient(155deg,var(--rank-silver-hi)_0%,var(--rank-silver)_62%)]',
    number: 'text-rank-silver',
  },
  3: {
    plate:
      'bg-[linear-gradient(155deg,var(--rank-bronze-hi)_0%,var(--rank-bronze)_62%)]',
    number: 'text-rank-bronze',
  },
} as const

/** Cup on a 16-unit grid (x, y, width, height): bowl, handles, stem, base. */
const CUP = [
  [3, 2, 10, 2],
  [4, 4, 8, 4],
  [5, 8, 6, 1],
  [1, 3, 1, 4],
  [2, 7, 2, 1],
  [14, 3, 1, 4],
  [12, 7, 2, 1],
  [7, 9, 2, 2],
  [5, 11, 6, 1],
  [4, 12, 8, 2],
] as const

function placeName(rank: number) {
  if (rank === 1) return '1re place'
  return `${rank}e place`
}

/**
 * Pixel-art cup on a 16-unit grid for ranks 1–3; numbered square beyond.
 * The number is real text; the cup is decorative (aria-hidden).
 */
export function RankBadge({
  rank,
  size = 'md',
  bare = false,
  plain = false,
  label,
  className,
}: RankBadgeProps) {
  const metal =
    !plain && rank >= 1 && rank <= 3 ? METALS[rank as 1 | 2 | 3] : null
  const accessible = label ?? placeName(rank)

  if (!metal) {
    return (
      <span
        role="img"
        aria-label={accessible}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-none bg-surface-sunken font-display text-ink-primary',
          SIZES[size],
          className,
        )}
      >
        <span aria-hidden="true">{rank}</span>
      </span>
    )
  }

  return (
    <span
      role="img"
      aria-label={accessible}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-none',
        SIZES[size],
        !bare && metal.plate,
        className,
      )}
    >
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        focusable="false"
        shapeRendering="crispEdges"
        className={cn(
          'size-full fill-current',
          bare ? 'text-ink-primary' : 'text-ink-on-accent',
        )}
      >
        {CUP.map(([x, y, width, height]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={width} height={height} />
        ))}
      </svg>
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-x-0 top-[18%] flex h-[30%] items-center justify-center font-display leading-none',
          metal.number,
        )}
      >
        {rank}
      </span>
    </span>
  )
}
