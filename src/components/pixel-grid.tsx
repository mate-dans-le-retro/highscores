import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

import { cn } from '#/lib/utils'

type PixelGridOwnProps = {
  /** Tone the pattern down when it sits over a photo or poster. */
  over?: boolean
  className?: string
  children?: ReactNode
}

type PixelGridProps<T extends ElementType> = PixelGridOwnProps & {
  as?: T
} & Omit<ComponentPropsWithoutRef<T>, keyof PixelGridOwnProps | 'as'>

/**
 * Regular CSS pixel-square pattern behind content (theme-aware).
 * Decorative only — do not put small text on it; avoid under scene text.
 */
export function PixelGrid<T extends ElementType = 'div'>({
  as,
  over = false,
  className,
  children,
  ...rest
}: PixelGridProps<T>) {
  const Tag = as ?? 'div'
  return (
    <Tag
      className={cn(
        'mdlr-pixelgrid relative',
        over && 'mdlr-pixelgrid--over',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}
