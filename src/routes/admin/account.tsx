import { Link, createFileRoute } from '@tanstack/react-router'

import { SetPasswordForm } from '#/components/admin/set-password-form'
import { Button } from '#/components/ui/button'
import { sessionHasPassword, useAdminAuth } from '#/lib/admin'

export const Route = createFileRoute('/admin/account')({
  component: AdminAccount,
})

function AdminAccount() {
  const auth = useAdminAuth()
  if (auth.status !== 'admin') return null

  const email = auth.session.user.email
  const hasPassword = sessionHasPassword(auth.session)

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-h3">Mon compte</h1>
        <p className="text-body-sm text-ink-secondary">
          {email ?? 'Sans email'} · Admin
        </p>
      </div>

      <section className="rounded-xl bg-surface-raised p-4 shadow-card md:p-6">
        {hasPassword ? (
          <SetPasswordForm
            heading="Changer le mot de passe"
            hint="Un mot de passe est déjà défini. Tu peux le remplacer ici, ou te connecter avec Google."
          />
        ) : (
          <SetPasswordForm />
        )}
      </section>

      <Button variant="outline" asChild>
        <Link to="/admin">Retour aux soumissions</Link>
      </Button>
    </div>
  )
}
