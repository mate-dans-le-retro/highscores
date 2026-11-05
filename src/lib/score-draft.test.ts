import { describe, expect, it } from 'vitest'

import {
  clearScoreDraft,
  emptyScoreDraft,
  readScoreDraft,
  resetScoreDraftKeepName,
  writeScoreDraft,
} from './score-draft'

function memoryStore(initial: Record<string, string> = {}) {
  const data = { ...initial }
  return {
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => {
      data[key] = value
    },
    removeItem: (key: string) => {
      delete data[key]
    },
  }
}

describe('score draft', () => {
  it('round-trips through session storage', () => {
    const store = memoryStore()
    const draft = emptyScoreDraft()
    draft.playerName = 'Julie'
    draft.scoreText = '128400'
    draft.photoDataUrl = 'data:image/jpeg;base64,abc'
    writeScoreDraft(draft, store)
    expect(readScoreDraft(store).playerName).toBe('Julie')
    expect(readScoreDraft(store).photoDataUrl).toBe(
      'data:image/jpeg;base64,abc',
    )
  })

  it('keeps the nickname when resetting', () => {
    const store = memoryStore()
    const draft = emptyScoreDraft()
    draft.playerName = 'Julie'
    draft.scoreText = '10'
    const next = resetScoreDraftKeepName(draft, store)
    expect(next.playerName).toBe('Julie')
    expect(next.scoreText).toBe('')
    expect(readScoreDraft(store).playerName).toBe('Julie')
  })

  it('clears a broken payload', () => {
    const store = memoryStore({ 'mdlr-highscores:score-draft:v1': '{nope' })
    expect(readScoreDraft(store)).toEqual(emptyScoreDraft())
    clearScoreDraft(store)
    expect(readScoreDraft(store)).toEqual(emptyScoreDraft())
  })
})
