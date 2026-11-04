import { mockSource, mockTools } from './mock/mock-source'
import type { HighscoresSource } from './source'
import { supabaseSource } from './supabase-source'

declare global {
  interface Window {
    mdlrMock?: typeof mockTools
  }
}

/** VITE_DATA_SOURCE=mock: fake data in localStorage, no Supabase needed. */
export const isMock = import.meta.env.VITE_DATA_SOURCE === 'mock'

export const source: HighscoresSource = isMock ? mockSource : supabaseSource

if (isMock && typeof window !== 'undefined') window.mdlrMock = mockTools
