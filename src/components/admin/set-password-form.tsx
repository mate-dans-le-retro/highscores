import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { passwordUpdateErrorMessage, setPassword } from '#/lib/admin'

const MIN_PASSWORD_LENGTH = 6

export function SetPasswordForm({
  heading = 'Définir un mot de passe',
  hint = 'Utile si Google tombe le jour J : tu pourras te connecter avec ton email.',
  requireCurrentPassword = false,
  userId,
  onDone,
}: {
  heading?: string
  hint?: string
  /**
   * Pass true only when changing a password tied to an email identity.
   * Google-only first set (and Google-only recovery) stays false.
   */
  requireCurrentPassword?: boolean
  /** When set, invalidates currentUserHasPasswordQuery after a successful save. */
  userId?: string
  onDone?: () => void
}) {
  const queryClient = useQueryClient()
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPasswordValue] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (requireCurrentPassword && !currentPassword) {
      setError('Saisis ton mot de passe actuel.')
      return
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(
        `Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.`,
      )
      return
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne sont pas identiques.')
      return
    }
    setPending(true)
    try {
      await setPassword(
        password,
        requireCurrentPassword ? currentPassword : undefined,
      )
      setDone(true)
      setCurrentPassword('')
      setPasswordValue('')
      setConfirm('')
      // Never let a has-password refetch mark a successful Auth write as failed.
      if (userId) {
        void queryClient.invalidateQueries({
          queryKey: ['admin', 'has-password', userId],
        })
      }
      onDone?.()
    } catch (err) {
      setError(passwordUpdateErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  if (done) {
    return (
      <p className="text-body-sm text-ink-secondary">
        Mot de passe enregistré. Tu peux aussi te connecter avec ton email.
      </p>
    )
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-h6">{heading}</h2>
        <p className="text-body-sm text-ink-secondary">{hint}</p>
      </div>
      {error && (
        <p role="alert" className="text-body-sm text-destructive">
          {error}
        </p>
      )}
      {requireCurrentPassword ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="current-password">Mot de passe actuel</Label>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </div>
      ) : null}
      <div className="flex flex-col gap-2">
        <Label htmlFor="new-password">Nouveau mot de passe</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          value={password}
          onChange={(event) => setPasswordValue(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm-password">Confirme le mot de passe</Label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
      </div>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
      </Button>
    </form>
  )
}
