import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { signIn, signInWithGoogle } from '#/lib/admin'
import { oauthErrorMessage, withoutOAuthError } from '#/lib/oauth-error'

export function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(() =>
    oauthErrorMessage(new URL(window.location.href)),
  )
  const [pending, setPending] = useState(false)

  useEffect(() => {
    const clean = withoutOAuthError(new URL(window.location.href))
    if (clean.href !== window.location.href) {
      window.history.replaceState(window.history.state, '', clean)
    }
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      await signIn(email, password)
    } catch {
      setError('Email ou mot de passe incorrect. Réessaie !')
    } finally {
      setPending(false)
    }
  }

  async function continueWithGoogle() {
    setPending(true)
    setError(null)
    try {
      // On success the browser leaves for Google: the button stays disabled.
      await signInWithGoogle()
    } catch {
      setError("La connexion avec Google n'a pas abouti. Réessaie !")
      setPending(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="flex w-full max-w-sm flex-col gap-5 rounded-xl bg-surface-raised p-8 shadow-card">
        <div className="flex flex-col gap-1">
          <p className="font-display text-xs text-ink-accent">MDLR</p>
          <h1 className="text-h3">Admin des highscores</h1>
          <p className="text-body-sm text-ink-secondary">
            Réservé aux bénévoles. Connecte-toi pour valider les scores.
          </p>
        </div>
        {error && (
          <p role="alert" className="text-body-sm text-destructive">
            {error}
          </p>
        )}
        <Button
          size="lg"
          disabled={pending}
          onClick={() => void continueWithGoogle()}
        >
          Continuer avec Google
        </Button>
        <div className="flex items-center gap-3 text-body-sm text-ink-secondary">
          <span className="h-px flex-1 bg-border" />
          ou
          <span className="h-px flex-1 bg-border" />
        </div>
        <form
          onSubmit={(event) => void submit(event)}
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <Button type="submit" variant="outline" size="lg" disabled={pending}>
            {pending ? 'Connexion…' : 'Se connecter'}
          </Button>
        </form>
      </div>
    </main>
  )
}
