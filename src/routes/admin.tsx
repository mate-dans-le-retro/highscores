import { useQuery } from '@tanstack/react-query'
import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { LogOut, MonitorPlay } from 'lucide-react'

import { AppBar } from '#/components/admin/app-bar'
import {
  AdminRealtimeProvider,
  useAdminRefetchInterval,
} from '#/components/admin/realtime-provider'
import { SetPasswordForm } from '#/components/admin/set-password-form'
import { SignIn } from '#/components/admin/sign-in'
import { ThemeToggle } from '#/components/admin/theme-toggle'
import { Button } from '#/components/ui/button'
import {
  sessionHasPassword,
  signOut,
  submissionCountsQuery,
  useAdminAuth,
} from '#/lib/admin'

export const Route = createFileRoute('/admin')({
  staticData: { theme: 'console' },
  // The session lives in the browser: nothing to render on the server.
  ssr: false,
  head: () => ({ meta: [{ title: 'Admin · Highscores MDLR' }] }),
  component: AdminLayout,
})

function AdminLayout() {
  const auth = useAdminAuth()

  if (auth.status === 'loading') {
    return (
      <main className="grid min-h-screen place-items-center">
        <p className="text-body-ui text-ink-secondary">Chargement…</p>
      </main>
    )
  }

  if (auth.status === 'signed-out') return <SignIn />

  if (auth.status === 'not-admin') {
    const needsPassword = !sessionHasPassword(auth.session)
    return (
      <main className="grid min-h-screen place-items-center px-4 py-8">
        <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-h3">Pas encore admin</h1>
            <p className="text-body-ui text-ink-secondary">
              Ton compte ({auth.session.user.email}) existe, mais il n'a pas
              encore le rôle admin. Demande à un admin de te promouvoir depuis
              l'onglet Utilisateurs.
            </p>
            <Button variant="outline" onClick={() => void signOut()}>
              Se déconnecter
            </Button>
          </div>
          {needsPassword && (
            <div className="w-full rounded-xl bg-surface-raised p-6 text-left shadow-card">
              <SetPasswordForm />
            </div>
          )}
        </div>
      </main>
    )
  }

  return (
    <AdminRealtimeProvider>
      <div className="flex min-h-screen flex-col">
        <AdminTopBar email={auth.session.user.email ?? ''} />
        <div className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 md:px-8">
          <Outlet />
        </div>
      </div>
    </AdminRealtimeProvider>
  )
}

const navPillBase =
  'inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-extrabold leading-none no-underline transition-colors'

function AdminTopBar({ email }: { email: string }) {
  const refetchInterval = useAdminRefetchInterval()
  const counts = useQuery({ ...submissionCountsQuery, refetchInterval })
  const pending = counts.data?.pending ?? 0

  return (
    <AppBar title="Highscores">
      <nav
        className="mr-1 hidden items-center gap-1 md:flex"
        aria-label="Sections"
      >
        <NavTab to="/admin" exact pending={pending}>
          Soumissions
        </NavTab>
        <NavTab to="/admin/games">Jeux</NavTab>
        <NavTab to="/admin/settings">Écran</NavTab>
        <NavTab to="/admin/users">Utilisateurs</NavTab>
      </nav>
      <div className="flex items-center gap-2 text-ink-on-accent sm:gap-3">
        {email ? (
          <Link
            to="/admin/account"
            className="hidden max-w-56 truncate text-body-sm text-ink-on-accent no-underline hover:underline md:inline"
            title="Mon compte"
          >
            {email}
          </Link>
        ) : null}
        <span className="hidden rounded-full border-2 border-brand-purple bg-transparent px-3 py-0.5 text-caption font-extrabold text-ink-on-accent sm:inline">
          Admin
        </span>
        <ThemeToggle />
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-brand-purple bg-transparent text-ink-on-accent hover:bg-brand-purple/25 hover:text-ink-on-accent"
        >
          <a href="/" target="_blank" rel="noreferrer">
            <MonitorPlay />
            <span className="sr-only xl:not-sr-only">
              Ouvrir l'écran public
            </span>
          </a>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-ink-on-accent hover:bg-brand-purple/25 hover:text-ink-on-accent"
          title={`Se déconnecter (${email})`}
          aria-label="Se déconnecter"
          onClick={() => void signOut()}
        >
          <LogOut />
        </Button>
      </div>
    </AppBar>
  )
}

function NavTab({
  to,
  children,
  exact = false,
  pending,
}: {
  to: '/admin' | '/admin/games' | '/admin/settings' | '/admin/users'
  children: string
  exact?: boolean
  pending?: number
}) {
  return (
    <Link
      to={to}
      activeOptions={exact ? { exact: true } : undefined}
      className={navPillBase}
      inactiveProps={{
        className: 'text-ink-on-accent hover:bg-brand-purple/25',
      }}
      activeProps={{
        className:
          'bg-brand-purple text-ink-on-accent-large hover:bg-brand-purple',
      }}
    >
      {children}
      {pending != null && pending > 0 ? (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-surface-raised px-1.5 text-xs text-ink-primary">
          {pending}
        </span>
      ) : null}
    </Link>
  )
}
