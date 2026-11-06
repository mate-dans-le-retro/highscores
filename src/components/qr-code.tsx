import { encode } from 'uqr'

import { cn } from '@/lib/utils'

interface QrCodeProps {
  value: string
  label: string
  className?: string
}

export function QrCode({ value, label, className }: QrCodeProps) {
  const { data, size } = encode(value, { ecc: 'M', border: 4 })

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
      className={cn(
        // `block` avoids the inline-SVG baseline gap under the square.
        'block bg-surface-inverse fill-ink-inverse',
        className,
      )}
    >
      {data.flatMap((row, y) =>
        row.map((isDark, x) =>
          isDark ? (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />
          ) : null,
        ),
      )}
    </svg>
  )
}
