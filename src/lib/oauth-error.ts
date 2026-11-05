const ERROR_PARAMS = ['error', 'error_code', 'error_description']

// Supabase Auth reports a failed OAuth sign-in in both the query and the hash.
function errorParams(url: URL) {
  const hash = new URLSearchParams(url.hash.replace(/^#/, ''))
  const read = (name: string) =>
    url.searchParams.get(name) ?? hash.get(name) ?? null
  return {
    code: read('error_code'),
    description: read('error_description'),
    hasError: ERROR_PARAMS.some((name) => read(name) !== null),
  }
}

/** French message for the OAuth error carried by a callback URL, if any. */
export function oauthErrorMessage(url: URL) {
  const { code, description, hasError } = errorParams(url)
  if (!hasError) return null

  // Sign-ups are closed: a Google account with no volunteer account lands here.
  if (
    code === 'signup_disabled' ||
    /signups? not allowed/i.test(description ?? '')
  ) {
    return "Ce compte Google n'est pas encore bénévole. Demande à Clément de t'ajouter."
  }
  return "La connexion avec Google n'a pas abouti. Réessaie !"
}

/** The same URL without the OAuth error, so a reload does not show it again. */
export function withoutOAuthError(url: URL) {
  const clean = new URL(url)
  for (const name of ERROR_PARAMS) clean.searchParams.delete(name)

  const hash = new URLSearchParams(clean.hash.replace(/^#/, ''))
  if (ERROR_PARAMS.some((name) => hash.has(name))) {
    for (const name of ERROR_PARAMS) hash.delete(name)
    clean.hash = hash.toString()
  }

  return clean
}
