import { describe, expect, it } from 'vitest'

import {
  clearScoreDraft,
  emptyScoreDraft,
  readScoreDraft,
  resetScoreDraftKeepName,
  writeScoreDraft,
} from './score-draft'
import type { ScoreDraft } from './score-draft'

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

/** An empty draft, whatever its (random) submission id. */
const withoutId = ({ submissionId: _id, ...rest }: ScoreDraft) => rest

describe('score draft', () => {
  it('round-trips through session storage', () => {
    const store = memoryStore()
    const draft = emptyScoreDraft()
    draft.playerName = 'Julie'
    draft.scoreText = '128400'
    draft.photoId = 'photo-1'
    writeScoreDraft(draft, store)
    expect(readScoreDraft(store)).toEqual(draft)
  })

  it('gives each new draft its own submission id', () => {
    expect(emptyScoreDraft().submissionId).not.toBe(
      emptyScoreDraft().submissionId,
    )
  })

  it('drops the v1 draft, which held the photo as a data URL', () => {
    const store = memoryStore({
      'mdlr-highscores:score-draft:v1': '{"photoDataUrl":"data:…"}',
    })
    expect(withoutId(readScoreDraft(store))).toEqual(
      withoutId(emptyScoreDraft()),
    )
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

  it('keeps the nickname but not the submission id when resetting', () => {
    const store = memoryStore()
    const draft = emptyScoreDraft()
    draft.playerName = 'Julie'
    draft.scoreText = '10'
    const next = resetScoreDraftKeepName(draft, store)
    expect(next.playerName).toBe('Julie')
    expect(next.scoreText).toBe('')
    expect(next.submissionId).not.toBe(draft.submissionId)
    expect(readScoreDraft(store).playerName).toBe('Julie')
  })

  it('clears a broken payload', () => {
    const store = memoryStore({ 'mdlr-highscores:score-draft:v2': '{nope' })
    expect(withoutId(readScoreDraft(store))).toEqual(
      withoutId(emptyScoreDraft()),
    )
    clearScoreDraft(store)
    expect(withoutId(readScoreDraft(store))).toEqual(
      withoutId(emptyScoreDraft()),
    )
  })
})
