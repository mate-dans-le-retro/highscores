const CLOSED =
  'Les envois sont fermés pour le moment. Demande à un bénévole ou réessaie plus tard.'
const RATE_LIMITED = 'Trop de monde, réessaie dans une minute.'
const GENERIC =
  "Oups, l'envoi a planté. Vérifie ta connexion et retente ta chance."

type ErrorLike = {
  code?: unknown
  hint?: unknown
  message?: unknown
}

function asErrorLike(error: unknown): ErrorLike {
  if (error && typeof error === 'object') return error
  if (typeof error === 'string') return { message: error }
  return {}
}

function text(value: unknown) {
  return typeof value === 'string' ? value : ''
}

/**
 * Maps Supabase / mock submission failures to a short French message for the
 * player. RLS 42501 = submissions closed; P0001 + hint rate_limited = room cap.
 */
export function submissionErrorMessage(error: unknown): string {
  const { code, hint, message } = asErrorLike(error)
  const codeText = text(code)
  const hintText = text(hint).toLowerCase()
  const messageText = text(message).toLowerCase()

  if (hintText === 'rate_limited' || codeText === 'P0001') return RATE_LIMITED
  if (
    codeText === '42501' ||
    messageText.includes('submissions are closed') ||
    messageText.includes('submissions_open')
  ) {
    return CLOSED
  }

  return GENERIC
}
