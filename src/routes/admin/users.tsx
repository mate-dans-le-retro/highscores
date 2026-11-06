import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import { Button } from '#/components/ui/button'
import {
  registeredUsersQuery,
  setUserAdmin,
  useAdminAuth,
  useInvalidateAdmin,
} from '#/lib/admin'
import type { RegisteredUser } from '#/lib/admin'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/admin/users')({
  component: AdminUsers,
})

function AdminUsers() {
  const auth = useAdminAuth()
  const users = useQuery(registeredUsersQuery)
  const invalidate = useInvalidateAdmin()
  const selfId = auth.status === 'admin' ? auth.session.user.id : null

  const promote = useMutation({
    mutationFn: ({ id, makeAdmin }: { id: string; makeAdmin: boolean }) =>
      setUserAdmin(id, makeAdmin),
    onSettled: invalidate,
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-h3">Utilisateurs</h1>
        <p className="text-body-sm text-ink-secondary">
          Les comptes inscrits (Google ou email). Un compte seul n'ouvre pas
          l'admin : il faut le promouvoir ici.
        </p>
      </div>

      {users.isError && (
        <p role="alert" className="text-body-sm text-destructive">
          Impossible de charger la liste. Vérifie que la migration a été
          appliquée, puis réessaie.
        </p>
      )}
      {promote.isError && (
        <p role="alert" className="text-body-sm text-destructive">
          {promoteErrorMessage(promote.error)}
        </p>
      )}

      {!users.data ? (
        <p className="text-body-sm text-ink-secondary">Chargement…</p>
      ) : users.data.length === 0 ? (
        <p className="text-body-sm text-ink-secondary">
          Personne n'est encore inscrit. Demande aux collègues de créer un
          compte sur cette page de connexion.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {users.data.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              isSelf={user.id === selfId}
              pending={promote.isPending && promote.variables.id === user.id}
              onPromote={() => promote.mutate({ id: user.id, makeAdmin: true })}
              onDemote={() => promote.mutate({ id: user.id, makeAdmin: false })}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function UserRow({
  user,
  isSelf,
  pending,
  onPromote,
  onDemote,
}: {
  user: RegisteredUser
  isSelf: boolean
  pending: boolean
  onPromote: () => void
  onDemote: () => void
}) {
  const providers = user.providers.length
    ? user.providers.join(', ')
    : 'inconnu'

  return (
    <li
      className={cn(
        'flex flex-col gap-3 rounded-xl bg-surface-raised p-4 shadow-card sm:flex-row sm:items-center sm:justify-between',
      )}
    >
      <div className="min-w-0 flex flex-col gap-1">
        <p className="truncate font-semibold text-ink-primary">
          {user.email ?? 'Sans email'}
          {isSelf ? ' (toi)' : ''}
        </p>
        <p className="text-body-sm text-ink-secondary">
          {user.is_admin ? 'Admin' : 'En attente'}
          {' · '}
          {providers}
          {user.has_password ? ' · mot de passe' : ''}
          {' · '}
          inscrit le{' '}
          {new Intl.DateTimeFormat('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }).format(new Date(user.created_at))}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        {user.is_admin ? (
          <Button
            variant="outline"
            size="sm"
            disabled={pending || isSelf}
            title={
              isSelf
                ? 'Tu ne peux pas te retirer toi-même'
                : 'Retirer le rôle admin'
            }
            onClick={onDemote}
          >
            Retirer admin
          </Button>
        ) : (
          <Button size="sm" disabled={pending} onClick={onPromote}>
            Promouvoir admin
          </Button>
        )}
      </div>
    </li>
  )
}

function promoteErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  if (/cannot demote yourself/i.test(message)) {
    return 'Tu ne peux pas te retirer toi-même de la liste des admins.'
  }
  if (/cannot demote the last admin/i.test(message)) {
    return 'Impossible de retirer le dernier admin.'
  }
  if (/not authorized|42501/i.test(message)) {
    return "Tu n'as pas le droit de modifier les utilisateurs."
  }
  return "La modification n'a pas abouti. Réessaie !"
}
