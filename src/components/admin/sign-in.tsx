import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Logo } from '#/components/logo'
import { PixelGrid } from '#/components/pixel-grid'
import { PixelPanel } from '#/components/pixel-panel'
import { signIn, signInWithGoogle, signUp } from '#/lib/admin'
import { oauthErrorMessage, withoutOAuthError } from '#/lib/oauth-error'

type Mode = 'sign-in' | 'sign-up'

const SIGN_UP_HINT =
  "Ton accès admin sera disponible après validation d'un admin."

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
          `Compte créé. Si on te demande de confirmer ton email, ouvre le lien puis reconnecte-toi. ${SIGN_UP_HINT}`,
        )
        setMode('sign-in')
        setPassword('')
        return
      }
      // Session present: AdminLayout will show "Pas encore admin".
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

  // PixelPanel is white (surface-inverse) in arcade: ink-inverse = purple text.
  return (
    <div data-theme="arcade" className="min-h-screen bg-surface-base">
      <PixelGrid className="grid min-h-screen place-items-center bg-surface-base px-4 py-10">
        <PixelPanel label="HIGHSCORES" className="w-full max-w-md shadow-pixel">
          <div className="flex flex-col gap-5 text-ink-inverse">
            <Logo
              src="/mdlr-logo-color-dark.svg"
              className="m-0 w-48 self-center"
            />
            <div className="flex flex-col gap-1 text-center">
              <h1 className="text-h3 text-ink-inverse">
                {mode === 'sign-up' ? 'Inscription' : 'Connexion'}
              </h1>
              {mode === 'sign-up' ? (
                <p className="text-body-sm text-ink-inverse/80">
                  {SIGN_UP_HINT}
                </p>
              ) : null}
            </div>
            {error ? (
              <p role="alert" className="text-body-sm text-destructive">
                {error}
              </p>
            ) : null}
            {info ? (
              <p role="status" className="text-body-sm text-ink-inverse/80">
                {info}
              </p>
            ) : null}
            <Button
              size="lg"
              variant="pixel"
              disabled={pending}
              className="w-full"
              onClick={() => void continueWithGoogle()}
            >
              Continuer avec Google
            </Button>
            <div className="flex items-center gap-3 text-body-sm text-ink-inverse/70">
              <span className="h-px flex-1 bg-line-strong/40" />
              ou
              <span className="h-px flex-1 bg-line-strong/40" />
            </div>
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => void submit(event)}
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-ink-inverse">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  disabled={pending}
                  className="border-line-strong bg-surface-inverse text-ink-inverse placeholder:text-ink-inverse/50"
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-ink-inverse">
                  Mot de passe
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={
                    mode === 'sign-up' ? 'new-password' : 'current-password'
                  }
                  required
                  minLength={6}
                  value={password}
                  disabled={pending}
                  className="border-line-strong bg-surface-inverse text-ink-inverse placeholder:text-ink-inverse/50"
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <Button
                type="submit"
                size="lg"
                variant="pixel"
                disabled={pending}
                className="w-full"
              >
                {pending
                  ? mode === 'sign-up'
                    ? 'Création…'
                    : 'Connexion…'
                  : mode === 'sign-up'
                    ? 'Créer un compte'
                    : 'Se connecter'}
              </Button>
            </form>
            <p className="text-center text-body-sm text-ink-inverse/70">
              {mode === 'sign-in' ? (
                <>
                  Pas encore de compte ?{' '}
                  <button
                    type="button"
                    className="font-extrabold text-ink-inverse underline-offset-2 hover:underline"
                    onClick={() => {
                      setMode('sign-up')
                      setError(null)
                      setInfo(null)
                    }}
                  >
                    S&apos;inscrire
                  </button>
                </>
              ) : (
                <>
                  Déjà inscrit ?{' '}
                  <button
                    type="button"
                    className="font-extrabold text-ink-inverse underline-offset-2 hover:underline"
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
        </PixelPanel>
      </PixelGrid>
    </div>
  )
}
