import { cn } from '#/lib/utils'

type RankBadgeSize = 'xs' | 'sm' | 'md' | 'lg'

type RankBadgeProps = {
  rank: number
  size?: RankBadgeSize
  /** Skip the coloured plate (e.g. on a podium step that already carries the metal). */
  bare?: boolean
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
    plate: 'bg-[linear-gradient(135deg,var(--rank-gold-hi),var(--rank-gold))]',
    ink: 'text-ink-on-accent',
  },
  2: {
    plate:
      'bg-[linear-gradient(135deg,var(--rank-silver-hi),var(--rank-silver))]',
    ink: 'text-ink-on-accent',
  },
  3: {
    plate:
      'bg-[linear-gradient(135deg,var(--rank-bronze-hi),var(--rank-bronze))]',
    ink: 'text-ink-on-accent',
  },
} as const

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
  label,
  className,
}: RankBadgeProps) {
  const metal = rank >= 1 && rank <= 3 ? METALS[rank as 1 | 2 | 3] : null
  const accessible = label ?? placeName(rank)

  if (!metal) {
    return (
      <span
        role="img"
        aria-label={accessible}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-none bg-surface-overlay font-display text-ink-primary',
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
        bare ? 'text-ink-primary' : metal.ink,
        className,
      )}
    >
      <CupIcon className="absolute inset-[12.5%] text-current opacity-90" />
      <span
        aria-hidden="true"
        className="relative z-10 translate-y-[18%] font-display leading-none"
      >
        {rank}
      </span>
    </span>
  )
}

/** Trophy cup drawn on a 16×16 grid, with two units of margin top and bottom. */
function CupIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn('size-full', className)}
      aria-hidden="true"
      focusable="false"
    >
      {/* Bowl */}
      <path
        fill="currentColor"
        d="M4 2h8v1H4zm-1 1h10v1H3zm0 1h10v1H3zm1 1h8v1H4zm1 1h6v1H5zm1 1h4v1H6z"
      />
      {/* Stem + base */}
      <path fill="currentColor" d="M7 9h2v2H7zm-2 2h6v1H5zm-1 1h8v1H4z" />
      {/* Handles */}
      <path fill="currentColor" d="M2 3h1v3H2zm11 0h1v3h-1z" />
    </svg>
  )
}
