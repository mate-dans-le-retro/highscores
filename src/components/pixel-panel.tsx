import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { cn } from '#/lib/utils'

type PixelPanelProps = {
  /** Display-font label above the content. Three words at most. */
  label?: string
  /** `accent` (default) uses the pink border; `plain` uses line-strong. */
  tone?: 'accent' | 'plain'
  children: ReactNode
} & ComponentPropsWithoutRef<'div'>

/**
 * Arcade-register frame: square corners, pixel border, hard shadow.
 * Inner surface is surface-inverse with ink-inverse text.
 */
export function PixelPanel({
  label,
  tone = 'accent',
  className,
  children,
  ...props
}: PixelPanelProps) {
  return (
    <div
      className={cn(
        'rounded-none border-4 bg-surface-inverse text-ink-inverse shadow-pixel',
        tone === 'accent' ? 'border-line-accent' : 'border-line-strong',
        className,
      )}
      {...props}
    >
      {label ? (
        <p className="border-b-4 border-inherit px-6 py-4 font-display text-arcade-label text-ink-accent uppercase">
          {label}
        </p>
      ) : null}
      <div className="p-6">{children}</div>
    </div>
  )
}
