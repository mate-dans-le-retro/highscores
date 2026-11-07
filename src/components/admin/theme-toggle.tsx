import { Moon, Sun } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { toggleAdminTheme, useAdminTheme } from '#/lib/admin-theme'

/**
 * Light (`console`) ↔ dark (`arcade`) for admin chrome.
 * Same control as Tournois TanStack: ghost icon on the pink bar.
 */
export function ThemeToggle() {
  const theme = useAdminTheme()
  const isDark = theme === 'arcade'

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="text-ink-on-accent hover:bg-brand-purple/25 hover:text-ink-on-accent"
      aria-label={isDark ? 'Thème clair' : 'Thème sombre'}
      title={isDark ? 'Thème clair' : 'Thème sombre'}
      onClick={() => {
        toggleAdminTheme(theme)
      }}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  )
}
