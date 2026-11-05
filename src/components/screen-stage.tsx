import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

/** The projected screen is laid out once, at full HD, then scaled to fit. */
const STAGE_WIDTH = 1920
const STAGE_HEIGHT = 1080

/**
 * Fixed 1920×1080 canvas scaled to the window, letterboxed on the pixel
 * background. A projector never scrolls, whatever its resolution: the layout
 * inside is designed in stage pixels and always fits.
 */
export function ScreenStage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const fit = () =>
      setScale(
        Math.min(
          window.innerWidth / STAGE_WIDTH,
          window.innerHeight / STAGE_HEIGHT,
        ),
      )
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden bg-surface-sunken">
      <div
        className="absolute top-1/2 left-1/2 origin-center"
        style={{
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
