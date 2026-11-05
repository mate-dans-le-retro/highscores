import { clsx } from 'clsx'
import type { ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * The type scale of the design system (src/styles/mdlr/tailwind.css). Without
 * it, tailwind-merge reads `text-body` as a colour and drops it next to
 * `text-ink-secondary`.
 */
const TEXT_SIZES = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'eyebrow',
  'body',
  'body-ui',
  'body-sm',
  'caption',
  'numeric',
  'arcade-hero',
  'arcade-title',
  'arcade-name',
  'arcade-label',
  'scene-hero',
  'scene-row',
  'scene-meta',
  'scene-pixel',
]

const twMerge = extendTailwindMerge({ extend: { theme: { text: TEXT_SIZES } } })

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}
