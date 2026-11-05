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
    draft.photoId = 'photo-1'
    writeScoreDraft(draft, store)
    expect(readScoreDraft(store).playerName).toBe('Julie')
    expect(readScoreDraft(store).photoId).toBe('photo-1')
  })

  it('drops the v1 draft, which held the photo as a data URL', () => {
    const store = memoryStore({
      'mdlr-highscores:score-draft:v1': '{"photoDataUrl":"data:…"}',
    })
    expect(readScoreDraft(store)).toEqual(emptyScoreDraft())
    expect(store.getItem('mdlr-highscores:score-draft:v1')).toBeNull()
  })

  it('does not throw when the storage is full', () => {
    const store = {
      ...memoryStore(),
      setItem: () => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError')
      },
    }
    expect(() => writeScoreDraft(emptyScoreDraft(), store)).not.toThrow()
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
