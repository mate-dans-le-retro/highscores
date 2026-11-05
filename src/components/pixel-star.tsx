import { cn } from '#/lib/utils'

/** Five-point star on an 11 × 10 grid (x, y, width, height). */
const STAR = [
  [5, 0, 1, 1],
  [4, 1, 3, 2],
  [0, 3, 11, 1],
  [1, 4, 9, 1],
  [2, 5, 7, 2],
  [1, 7, 4, 1],
  [6, 7, 4, 1],
  [1, 8, 3, 1],
  [7, 8, 3, 1],
  [0, 9, 2, 1],
  [9, 9, 2, 1],
] as const

/**
 * Pixel-art star of the all-time record, gold by default. Size it with a
 * height (`h-*`): the width follows. Decorative unless given a `label`.
 */
export function PixelStar({
  label,
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 11 10"
      shapeRendering="crispEdges"
      focusable="false"
      {...(label
        ? { role: 'img', 'aria-label': label }
        : { 'aria-hidden': true })}
      className={cn(
        'aspect-[11/10] w-auto shrink-0 fill-current text-rank-gold',
        className,
      )}
    >
      {STAR.map(([x, y, width, height]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={width} height={height} />
      ))}
    </svg>
  )
}
