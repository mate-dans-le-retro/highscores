import { useSyncExternalStore } from 'react'

/** Light = console tokens; dark = arcade tokens (existing MDLR pair). */
export type AdminAppearance = 'light' | 'dark'

const STORAGE_KEY = 'mdlr-highscores-admin-appearance'

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) emit()
  })
}

export function getAdminAppearance(): AdminAppearance {
  if (typeof window === 'undefined') return 'light'
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === 'dark' || raw === 'light') return raw
  } catch {
    // Private mode or blocked storage: keep the default.
  }
  return 'light'
}

export function setAdminAppearance(appearance: AdminAppearance) {
  try {
    window.localStorage.setItem(STORAGE_KEY, appearance)
  } catch {
    // Ignore write failures; in-memory listeners still update this tab.
  }
  emit()
}

export function subscribeAdminAppearance(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function adminAppearanceToTheme(
  appearance: AdminAppearance,
): 'console' | 'arcade' {
  return appearance === 'dark' ? 'arcade' : 'console'
}

export function useAdminAppearance(): AdminAppearance {
  return useSyncExternalStore(
    subscribeAdminAppearance,
    getAdminAppearance,
    () => 'light',
  )
}
