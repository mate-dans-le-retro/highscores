import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { pixelCaps } from '#/lib/highscores'
import { cn } from '#/lib/utils'

type PixelPanelProps = {
  /** Display-font title inside the frame. Three words at most. */
  label?: string
  /** `accent` (default) uses the pink border; `plain` uses line-strong. */
  tone?: 'accent' | 'plain'
  children: ReactNode
} & ComponentPropsWithoutRef<'div'>

/**
 * Arcade-register frame: square corners, pixel border, hard shadow.
 * Inner surface is surface-inverse with ink-inverse text.
 *
 * The title sits inside the frame in `brand-pink`: allowed on white from
 * 24px, and the pixel size is 28px.
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
        'flex min-h-0 flex-col rounded-none border-4 bg-surface-inverse text-ink-inverse shadow-pixel',
        tone === 'accent' ? 'border-line-accent' : 'border-line-strong',
        className,
      )}
      {...props}
    >
      <div className="flex min-h-0 flex-1 flex-col p-6">
        {label ? (
          <h2 className="mb-4 shrink-0 font-display text-scene-pixel text-balance text-brand-pink">
            {pixelCaps(label)}
          </h2>
        ) : null}
        {children}
      </div>
    </div>
  )
}
