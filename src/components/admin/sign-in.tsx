import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { signIn, signInWithGoogle, signUp } from '#/lib/admin'
import { oauthErrorMessage, withoutOAuthError } from '#/lib/oauth-error'

type Mode = 'sign-in' | 'sign-up'

export function SignIn() {
  const [mode, setMode] = useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(() =>
    oauthErrorMessage(new URL(window.location.href)),
  )
  const [info, setInfo] = useState<string | null>(null)
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
    setInfo(null)
    try {
      if (mode === 'sign-in') {
        await signIn(email, password)
        return
      }
      const data = await signUp(email, password)
      if (!data.session) {
        setInfo(
          'Compte créé. Si on te demande de confirmer ton email, ouvre le lien puis reconnecte-toi. Ensuite, demande à Clément de te promouvoir bénévole.',
        )
        setMode('sign-in')
        setPassword('')
        return
      }
      // Session present: AuthLayout will show "Pas encore bénévole".
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message.toLowerCase() : ''
      if (mode === 'sign-up' && /already|registered|exists/i.test(message)) {
        setError('Ce compte existe déjà. Connecte-toi plutôt !')
      } else if (mode === 'sign-up') {
        setError("L'inscription n'a pas abouti. Réessaie !")
      } else {
        setError('Email ou mot de passe incorrect. Réessaie !')
      }
    } finally {
      setPending(false)
    }
  }

  async function continueWithGoogle() {
    setPending(true)
    setError(null)
    setInfo(null)
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
            Crée ton compte ou connecte-toi. L'accès bénévole arrive après une
            promotion par Clément.
          </p>
        </div>
        {error && (
          <p role="alert" className="text-body-sm text-destructive">
            {error}
          </p>
        )}
        {info && (
          <p role="status" className="text-body-sm text-ink-secondary">
            {info}
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
              autoComplete={
                mode === 'sign-up' ? 'new-password' : 'current-password'
              }
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <Button type="submit" variant="outline" size="lg" disabled={pending}>
            {pending
              ? mode === 'sign-up'
                ? 'Création…'
                : 'Connexion…'
              : mode === 'sign-up'
                ? 'Créer un compte'
                : 'Se connecter'}
          </Button>
        </form>
        <p className="text-center text-body-sm text-ink-secondary">
          {mode === 'sign-in' ? (
            <>
              Pas encore de compte ?{' '}
              <button
                type="button"
                className="font-semibold text-ink-accent underline-offset-2 hover:underline"
                onClick={() => {
                  setMode('sign-up')
                  setError(null)
                  setInfo(null)
                }}
              >
                S'inscrire
              </button>
            </>
          ) : (
            <>
              Déjà inscrit ?{' '}
              <button
                type="button"
                className="font-semibold text-ink-accent underline-offset-2 hover:underline"
                onClick={() => {
                  setMode('sign-in')
                  setError(null)
                  setInfo(null)
                }}
              >
                Se connecter
              </button>
            </>
          )}
        </p>
      </div>
    </main>
  )
}
