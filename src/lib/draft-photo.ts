import { useEffect, useState } from 'react'

import type { PreparedPhoto } from './data/photo'
import { randomUuid } from './random-uuid'

/**
 * The player's photo while they fill in the form. sessionStorage is far too
 * small for it (~5 MB, base64), so it lives in memory, mirrored in IndexedDB
 * to survive a reload; the draft itself only keeps its id.
 */
export interface DraftPhoto {
  id: string
  photo: PreparedPhoto
  /** Object URL of the proof, for the previews. */
  url: string
}

interface StoredPhoto {
  id: string
  proof: Blob
  thumb: Blob
}

export interface DraftPhotoBackend {
  put: (photo: StoredPhoto) => Promise<void>
  get: () => Promise<StoredPhoto | null>
  clear: () => Promise<void>
}

const DB_NAME = 'mdlr-highscores-draft'
const STORE = 'photo'
const KEY = 'current'

function request<T>(req: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB failed'))
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  if (typeof indexedDB === 'undefined')
    throw new Error('IndexedDB is not available')
  const open = indexedDB.open(DB_NAME, 1)
  open.onupgradeneeded = () => open.result.createObjectStore(STORE)
  const db = await request(open)
  try {
    return await request(run(db.transaction(STORE, mode).objectStore(STORE)))
  } finally {
    db.close()
  }
}

export const indexedDbBackend: DraftPhotoBackend = {
  put: async (photo) => {
    await withStore('readwrite', (store) => store.put(photo, KEY))
  },
  get: async () =>
    (await withStore<StoredPhoto | undefined>('readonly', (store) =>
      store.get(KEY),
    )) ?? null,
  clear: async () => {
    await withStore('readwrite', (store) => store.delete(KEY))
  },
}

export function createDraftPhotos(backend: DraftPhotoBackend) {
  let current: DraftPhoto | null = null

  function remember(id: string, photo: PreparedPhoto) {
    if (current) URL.revokeObjectURL(current.url)
    current = { id, photo, url: URL.createObjectURL(photo.proof) }
    return current
  }

  return {
    /** Never fails: without IndexedDB, the photo stays in memory only. */
    async save(photo: PreparedPhoto): Promise<DraftPhoto> {
      const saved = remember(randomUuid(), photo)
      try {
        await backend.put({ id: saved.id, ...photo })
      } catch (error) {
        console.warn('Draft photo kept in memory only', error)
      }
      return saved
    },

    peek(id: string | null): DraftPhoto | null {
      return id && current?.id === id ? current : null
    },

    /** Null when the photo is gone (another draft, or no IndexedDB). */
    async load(id: string): Promise<DraftPhoto | null> {
      if (current?.id === id) return current
      try {
        const stored = await backend.get()
        if (stored?.id !== id) return null
        return remember(id, { proof: stored.proof, thumb: stored.thumb })
      } catch {
        return null
      }
    },

    async clear() {
      if (current) URL.revokeObjectURL(current.url)
      current = null
      try {
        await backend.clear()
      } catch {
        // Nothing stored.
      }
    },
  }
}

export const draftPhotos = createDraftPhotos(indexedDbBackend)

export function useDraftPhoto(id: string | null) {
  const [loaded, setLoaded] = useState<{
    id: string
    photo: DraftPhoto | null
  } | null>(null)

  useEffect(() => {
    if (!id || draftPhotos.peek(id)) return
    let cancelled = false
    void draftPhotos.load(id).then((photo) => {
      if (!cancelled) setLoaded({ id, photo })
    })
    return () => {
      cancelled = true
    }
  }, [id])

  const cached = draftPhotos.peek(id)
  if (!id || cached) return { photo: cached, loading: false }
  if (loaded?.id === id) return { photo: loaded.photo, loading: false }
  return { photo: null, loading: true }
}
