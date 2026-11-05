import { describe, expect, it, vi } from 'vitest'

import { createDraftPhotos } from './draft-photo'
import type { DraftPhotoBackend } from './draft-photo'

function memoryBackend(): DraftPhotoBackend {
  let stored: Awaited<ReturnType<DraftPhotoBackend['get']>> = null
  return {
    put: (photo) => {
      stored = photo
      return Promise.resolve()
    },
    get: () => Promise.resolve(stored),
    clear: () => {
      stored = null
      return Promise.resolve()
    },
  }
}

const brokenBackend: DraftPhotoBackend = {
  put: () => Promise.reject(new Error('QuotaExceededError')),
  get: () => Promise.reject(new Error('no IndexedDB')),
  clear: () => Promise.reject(new Error('no IndexedDB')),
}

const photo = () => ({
  proof: new Blob(['proof'], { type: 'image/jpeg' }),
  thumb: new Blob(['thumb'], { type: 'image/jpeg' }),
})

describe('draft photos', () => {
  it('keeps the photo in memory for the next steps', async () => {
    const drafts = createDraftPhotos(memoryBackend())
    const saved = await drafts.save(photo())
    expect(drafts.peek(saved.id)).toBe(saved)
    expect(saved.url).toMatch(/^blob:/)
    expect(drafts.peek('another')).toBeNull()
  })

  it('finds the photo again after a reload', async () => {
    const backend = memoryBackend()
    const saved = await createDraftPhotos(backend).save(photo())
    const afterReload = createDraftPhotos(backend)
    expect(afterReload.peek(saved.id)).toBeNull()
    const loaded = await afterReload.load(saved.id)
    expect(await loaded?.photo.proof.text()).toBe('proof')
  })

  it('ignores a stored photo from another draft', async () => {
    const backend = memoryBackend()
    await createDraftPhotos(backend).save(photo())
    expect(await createDraftPhotos(backend).load('old-id')).toBeNull()
  })

  it('never refuses a photo when IndexedDB fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const drafts = createDraftPhotos(brokenBackend)
    const saved = await drafts.save(photo())
    expect(await drafts.load(saved.id)).toBe(saved)
    await expect(drafts.clear()).resolves.toBeUndefined()
    expect(drafts.peek(saved.id)).toBeNull()
  })
})
