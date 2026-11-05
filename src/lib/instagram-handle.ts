/** Matches the Postgres check after stripping a leading `@`. */
export const INSTAGRAM_HANDLE_PATTERN = /^[A-Za-z0-9._]{1,30}$/

/** Strip `@` and surrounding spaces. Empty input becomes null. */
export function normalizeInstagramHandle(raw: string): string | null {
  const trimmed = raw.trim().replace(/^@+/, '')
  return trimmed.length > 0 ? trimmed : null
}

/** Empty is valid (optional field). Non-empty must match the DB pattern. */
export function isValidInstagramHandle(raw: string): boolean {
  const handle = normalizeInstagramHandle(raw)
  if (handle === null) return true
  return INSTAGRAM_HANDLE_PATTERN.test(handle)
}
