import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { pixelCaps } from '#/lib/highscores'
import { cn } from '#/lib/utils'

type PixelPanelProps = {
  /** Display-font label above the frame. Three words at most. */
  label?: string
  /** `accent` (default) uses the pink border; `plain` uses line-strong. */
  tone?: 'accent' | 'plain'
  children: ReactNode
} & ComponentPropsWithoutRef<'div'>

/**
 * Arcade-register frame: square corners, pixel border, hard shadow.
 * Inner surface is surface-inverse with ink-inverse text.
 *
 * The label sits above the frame, as on the Highscores mockup, on a solid
 * chip: pink on white was unreadable, and text never sits on the pixel
 * pattern when projected. `className` sizes the whole block.
 */
export function PixelPanel({
  label,
  tone = 'accent',
  className,
  children,
  ...props
}: PixelPanelProps) {
  const frame = (
    <div
      className={cn(
        'flex min-h-0 flex-col rounded-none border-4 bg-surface-inverse text-ink-inverse shadow-pixel',
        tone === 'accent' ? 'border-line-accent' : 'border-line-strong',
        label ? 'flex-1' : className,
      )}
      {...(label ? {} : props)}
    >
      <div className="flex min-h-0 flex-1 flex-col p-6">{children}</div>
    </div>
  )
  if (!label) return frame

  return (
    <section
      className={cn('flex min-h-0 flex-col gap-3', className)}
      {...props}
    >
      <h2 className="max-w-full self-start bg-surface-sunken px-3 py-1 font-display text-scene-pixel text-balance text-ink-accent">
        {pixelCaps(label)}
      </h2>
      {frame}
    </section>
  )
}
