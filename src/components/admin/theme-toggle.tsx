import { Moon, Sun } from 'lucide-react'

import { Button } from '#/components/ui/button'
import type { AdminAppearance } from '#/lib/admin-theme'
import { setAdminAppearance, useAdminAppearance } from '#/lib/admin-theme'
import { cn } from '#/lib/utils'

const OPTIONS: { id: AdminAppearance; label: string; Icon: typeof Sun }[] = [
  { id: 'light', label: 'Clair', Icon: Sun },
  { id: 'dark', label: 'Sombre', Icon: Moon },
]

type ThemeToggleProps = {
  className?: string
}

/**
 * Clair / sombre for the admin shell. Preference lives in localStorage.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const appearance = useAdminAppearance()

  return (
    <div
      role="group"
      aria-label="Thème de l'admin"
      className={cn(
        'inline-flex overflow-hidden rounded-md border-2 border-brand-purple',
        className,
      )}
    >
      {OPTIONS.map(({ id, label, Icon }) => {
        const active = appearance === id
        return (
          <Button
            key={id}
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={active}
            title={label}
            aria-label={label}
            onClick={() => setAdminAppearance(id)}
            className={cn(
              'h-8 gap-1.5 rounded-none px-2.5 text-ink-on-accent hover:bg-brand-purple/25 hover:text-ink-on-accent',
              active &&
                'bg-brand-purple text-ink-on-accent-large hover:bg-brand-purple hover:text-ink-on-accent-large',
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            <span className="hidden text-caption font-extrabold sm:inline">
              {label}
            </span>
          </Button>
        )
      })}
    </div>
  )
}
