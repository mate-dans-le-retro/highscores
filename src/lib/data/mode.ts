export const MOCK_SESSION_KEY = 'mdlr-highscores:mock'

interface SessionStore {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

/**
 * `?mock=1` turns the mock on and `?mock=0` turns it off, for the rest of the
 * tab's session (sessionStorage), whatever VITE_DATA_SOURCE says. Without the
 * parameter, VITE_DATA_SOURCE=mock decides; otherwise the real backend runs.
 */
export function resolveMockMode(
  search: string,
  session: SessionStore | null,
  envSource: string | undefined,
) {
  const param = new URLSearchParams(search).get('mock')
  if (session && (param === '1' || param === '0'))
    session.setItem(MOCK_SESSION_KEY, param)
  const choice = session?.getItem(MOCK_SESSION_KEY) ?? param
  if (choice === '1') return true
  if (choice === '0') return false
  return envSource === 'mock'
}
