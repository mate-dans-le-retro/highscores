import { isMock } from '#/lib/data'

/**
 * Fixed label so a mock screen is never mistaken for live data. On a phone it
 * is a thin strip along the bottom edge, so it never hides a whole button.
 */
export function DemoWatermark() {
  if (!isMock) return null
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 border-t-2 border-line-strong bg-surface-overlay py-0.5 text-center font-display text-caption whitespace-nowrap text-ink-secondary sm:inset-x-auto sm:right-4 sm:bottom-4 sm:border-4 sm:px-4 sm:py-2 sm:shadow-pixel"
    >
      Données de démo
    </div>
  )
}
