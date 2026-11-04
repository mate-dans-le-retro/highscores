import { mockSource, mockTools } from './mock/mock-source'
import { resolveMockMode } from './mode'
import type { HighscoresSource } from './source'
import { supabaseSource } from './supabase-source'

declare global {
  interface Window {
    mdlrMock?: typeof mockTools
  }
}

const inBrowser = typeof window !== 'undefined'

/** Fake data in localStorage, no Supabase needed: see resolveMockMode(). */
export const isMock = resolveMockMode(
  inBrowser ? window.location.search : '',
  inBrowser ? window.sessionStorage : null,
  import.meta.env.VITE_DATA_SOURCE,
)

export const source: HighscoresSource = isMock ? mockSource : supabaseSource

if (isMock && inBrowser) window.mdlrMock = mockTools
