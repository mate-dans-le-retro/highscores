import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'

import { SetPasswordForm } from '#/components/admin/set-password-form'
import { Button } from '#/components/ui/button'
import {
  currentUserHasPasswordQuery,
  sessionHasPasswordIdentity,
  useAdminAuth,
} from '#/lib/admin'

export const Route = createFileRoute('/admin/account')({
  component: AdminAccount,
})

function AdminAccount() {
  const auth = useAdminAuth()
  const signedIn =
    auth.status === 'admin' || auth.status === 'not-admin' ? auth.session : null
  const userId = signedIn?.user.id ?? ''

  const hasPasswordQuery = useQuery({
    ...currentUserHasPasswordQuery(userId || 'anonymous'),
    enabled: auth.status === 'admin' && Boolean(userId),
    placeholderData:
      signedIn && sessionHasPasswordIdentity(signedIn) ? true : undefined,
  })

  if (auth.status !== 'admin' || !signedIn) return null

  const hasPassword = hasPasswordQuery.data === true
  const checking =
    hasPasswordQuery.isPending && typeof hasPasswordQuery.data !== 'boolean'

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-h3">Mon compte</h1>
        <p className="text-body-sm text-ink-secondary">
          {signedIn.user.email ?? 'Sans email'} · Admin
        </p>
      </div>

      <section className="rounded-xl bg-surface-raised p-4 shadow-card md:p-6">
        {checking ? (
          <p className="text-body-sm text-ink-secondary">Chargement…</p>
        ) : hasPassword ? (
          <SetPasswordForm
            userId={userId}
            heading="Changer le mot de passe"
            hint="Un mot de passe est déjà défini. Tu peux le remplacer ici, ou te connecter avec Google."
          />
        ) : (
          <SetPasswordForm userId={userId} />
        )}
      </section>

      <Button variant="outline" asChild>
        <Link to="/admin">Retour aux soumissions</Link>
      </Button>
    </div>
  )
}
