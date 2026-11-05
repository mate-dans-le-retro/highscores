import { useQuery } from '@tanstack/react-query'
import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { LogOut, MonitorPlay } from 'lucide-react'

import { SignIn } from '#/components/admin/sign-in'
import { Button } from '#/components/ui/button'
import { signOut, submissionCountsQuery, useAdminAuth } from '#/lib/admin'

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
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <h1 className="text-h3">Pas encore bénévole</h1>
          <p className="text-body-ui text-ink-secondary">
            Ton compte ({auth.session.user.email}) existe, mais il n'est pas
            encore dans la liste des bénévoles. Demande à Clément de t'ajouter.
          </p>
          <Button variant="outline" onClick={() => void signOut()}>
            Se déconnecter
          </Button>
        </div>
      </main>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AdminTopBar email={auth.session.user.email ?? ''} />
      <div className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 md:px-8">
        <Outlet />
      </div>
    </div>
  )
}

// TanStack Router sets data-status="active" on the link of the current page.
const tabClass =
  'inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold text-ink-on-accent transition-colors hover:bg-surface-inverse/10 data-[status=active]:bg-surface-inverse data-[status=active]:text-ink-inverse'

function AdminTopBar({ email }: { email: string }) {
  const counts = useQuery(submissionCountsQuery)
  const pending = counts.data?.pending ?? 0

  return (
    <header className="sticky top-0 z-10 bg-primary">
      <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 md:px-8">
        <Link
          to="/admin"
          className="flex items-center gap-3 text-ink-on-accent"
        >
          <span className="font-display text-xs">MDLR</span>
          <span className="text-h6">Highscores</span>
        </Link>
        <nav className="order-last flex w-full items-center gap-1 overflow-x-auto md:order-none md:w-auto md:flex-1 md:justify-end">
          <Link
            to="/admin"
            activeOptions={{ exact: true }}
            className={tabClass}
          >
            Soumissions
            {pending > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-surface-raised px-1.5 text-xs text-ink-primary">
                {pending}
              </span>
            )}
          </Link>
          <Link to="/admin/games" className={tabClass}>
            Jeux
          </Link>
          <Link to="/admin/settings" className={tabClass}>
            Écran
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-line-strong bg-transparent text-ink-on-accent hover:bg-surface-inverse/10"
          >
            <a href="/" target="_blank" rel="noreferrer">
              <MonitorPlay />
              <span className="sr-only sm:not-sr-only">
                Ouvrir l'écran public
              </span>
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-ink-on-accent hover:bg-surface-inverse/10"
            title={`Se déconnecter (${email})`}
            aria-label="Se déconnecter"
            onClick={() => void signOut()}
          >
            <LogOut />
          </Button>
        </div>
      </div>
    </header>
  )
}
