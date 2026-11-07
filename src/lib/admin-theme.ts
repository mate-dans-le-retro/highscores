import { useSyncExternalStore } from 'react'

export type MdlrTheme = 'arcade' | 'console' | 'scene'

/** Admin chrome only: light (`console`) vs dark (`arcade`). Never `scene`. */
export type AdminTheme = 'console' | 'arcade'

/** Same key as Tournois TanStack admin, so the preference reads the same way. */
export const ADMIN_THEME_KEY = 'mdlr-admin-theme'
export const DEFAULT_ADMIN_THEME: AdminTheme = 'console'

/** Pre-#58 follow-up key; migrated once on read. */
const LEGACY_APPEARANCE_KEY = 'mdlr-highscores-admin-appearance'

const listeners = new Set<() => void>()

function isAdminTheme(value: string | null | undefined): value is AdminTheme {
  return value === 'console' || value === 'arcade'
}

function emit() {
  for (const listener of listeners) listener()
}

export function readAdminTheme(): AdminTheme {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_THEME
  try {
    const stored = window.localStorage.getItem(ADMIN_THEME_KEY)
    if (isAdminTheme(stored)) return stored

    const legacy = window.localStorage.getItem(LEGACY_APPEARANCE_KEY)
    if (legacy === 'dark' || legacy === 'light') {
      const migrated: AdminTheme = legacy === 'dark' ? 'arcade' : 'console'
      window.localStorage.setItem(ADMIN_THEME_KEY, migrated)
      window.localStorage.removeItem(LEGACY_APPEARANCE_KEY)
      return migrated
    }
  } catch {
    return DEFAULT_ADMIN_THEME
  }
  return DEFAULT_ADMIN_THEME
}

export function writeAdminTheme(theme: AdminTheme): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(ADMIN_THEME_KEY, theme)
    window.localStorage.removeItem(LEGACY_APPEARANCE_KEY)
  } catch {
    // Ignore quota / private-mode failures; in-memory listeners still update.
  }
  emit()
}

export function toggleAdminTheme(current: AdminTheme): AdminTheme {
  const next: AdminTheme = current === 'console' ? 'arcade' : 'console'
  writeAdminTheme(next)
  return next
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (
      event.key === ADMIN_THEME_KEY ||
      event.key === LEGACY_APPEARANCE_KEY ||
      event.key === null
    ) {
      listener()
    }
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage)
  }
  return () => {
    listeners.delete(listener)
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage)
    }
  }
}

export function useAdminTheme(): AdminTheme {
  return useSyncExternalStore(
    subscribe,
    readAdminTheme,
    () => DEFAULT_ADMIN_THEME,
  )
}

/**
 * Public screen (`scene`) and player form (`arcade`) keep their route theme.
 * Only `console` admin routes honor the persisted preference.
 */
export function resolveDocumentTheme(
  routeTheme: MdlrTheme,
  adminTheme: AdminTheme,
): MdlrTheme {
  if (routeTheme === 'console') return adminTheme
  return routeTheme
}

/**
 * Inline head script: apply persisted admin theme before paint on `/admin`.
 * Skips public and player routes so `scene` / `arcade` are never overwritten.
 */
export const ADMIN_THEME_BOOT_SCRIPT = `(function(){try{var p=location.pathname;if(p!=='/admin'&&p.indexOf('/admin/')!==0)return;var t=localStorage.getItem('${ADMIN_THEME_KEY}');if(t!=='arcade'&&t!=='console'){var legacy=localStorage.getItem('${LEGACY_APPEARANCE_KEY}');t=legacy==='dark'?'arcade':legacy==='light'?'console':'${DEFAULT_ADMIN_THEME}';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`
