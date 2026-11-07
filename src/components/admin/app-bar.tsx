import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

import { Logo } from '#/components/logo'
import { cn } from '#/lib/utils'

type AppBarProps = {
  title: string
  homeTo?: '/admin'
  /** Brand Color dark: transparent lockup, white block under « dans le rétro ». */
  logoSrc?: string
  showLogo?: boolean
  children?: ReactNode
  className?: string
}

/**
 * Pink product bar — the only surface-accent band on management screens.
 * Layout mirrors Tournois: logo + MDLR/title left, actions right.
 */
export function AppBar({
  title,
  homeTo = '/admin',
  logoSrc = '/mdlr-logo-color-dark.svg',
  showLogo = true,
  children,
  className,
}: AppBarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 border-b-4 border-brand-purple bg-surface-accent shadow-pixel',
        className,
      )}
      style={{ zIndex: 'var(--z-appbar)' }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:h-20 sm:px-6">
        <Link
          to={homeTo}
          aria-label="Highscores — accueil admin"
          className="flex min-w-0 items-center gap-3 text-ink-on-accent no-underline"
        >
          {showLogo ? (
            <Logo
              src={logoSrc}
              className="pointer-events-none m-0 hidden h-10 w-auto min-w-0 shrink-0 sm:block"
              alt=""
            />
          ) : null}
          <div className="min-w-0">
            <p className="font-display text-[10px] tracking-wide text-ink-on-accent">
              MDLR
            </p>
            <span className="block truncate text-h5 font-extrabold text-ink-on-accent">
              {title}
            </span>
          </div>
        </Link>
        <div className="flex shrink-0 items-center gap-3 text-ink-on-accent">
          {children}
        </div>
      </div>
    </header>
  )
}

type AppBarTagProps = {
  children: ReactNode
  className?: string
}

function AppBarTag({ children, className }: AppBarTagProps) {
  return (
    <span
      className={cn(
        'rounded-none border-2 border-brand-purple bg-brand-purple/30 px-2 py-0.5 font-display text-[9px] uppercase tracking-wide text-ink-on-accent',
        className,
      )}
    >
      {children}
    </span>
  )
}

AppBar.Tag = AppBarTag
