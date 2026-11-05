import { isMock } from '#/lib/data'

/** Fixed label so a mock screen is never mistaken for live data. */
export function DemoWatermark() {
  if (!isMock) return null
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed right-4 bottom-4 z-50 border-4 border-line-strong bg-surface-overlay px-4 py-2 font-display text-caption text-ink-secondary shadow-pixel"
    >
      Données de démo
    </div>
  )
}
