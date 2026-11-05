import { describe, expect, it } from 'vitest'

import { oauthErrorMessage, withoutOAuthError } from './oauth-error'

const ADMIN = 'https://scores.matedansleretro.fr/admin'

describe('oauthErrorMessage', () => {
  it('returns nothing without an error', () => {
    expect(oauthErrorMessage(new URL(ADMIN))).toBeNull()
    expect(oauthErrorMessage(new URL(`${ADMIN}?code=abc`))).toBeNull()
  })

  it('explains that an unknown Google account is not a volunteer', () => {
    const message =
      "Ce compte Google n'est pas encore bénévole. Demande à Clément de t'ajouter."
    expect(
      oauthErrorMessage(
        new URL(`${ADMIN}?error=access_denied&error_code=signup_disabled`),
      ),
    ).toBe(message)
    expect(
      oauthErrorMessage(
        new URL(
          `${ADMIN}#error=access_denied&error_description=Signups+not+allowed+for+this+instance`,
        ),
      ),
    ).toBe(message)
  })

  it('falls back to a generic message', () => {
    expect(
      oauthErrorMessage(
        new URL(`${ADMIN}?error=access_denied&error_description=Cancelled`),
      ),
    ).toBe("La connexion avec Google n'a pas abouti. Réessaie !")
  })
})

describe('withoutOAuthError', () => {
  it('removes the error from the query and the hash', () => {
    const url = new URL(
      `${ADMIN}?error=access_denied&error_code=signup_disabled&error_description=No#error=access_denied&error_description=No`,
    )
    expect(withoutOAuthError(url).href).toBe(ADMIN)
  })

  it('keeps everything else', () => {
    const url = new URL(`${ADMIN}?tab=games&error=access_denied#top`)
    expect(withoutOAuthError(url).href).toBe(`${ADMIN}?tab=games#top`)
  })
})
