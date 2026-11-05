/**
 * IndexedDB store for mock photos. The proof (~2000 px) and the thumbnail
 * (~800 px) outgrow localStorage; scores only keep a path like `mock-photo:…`.
 */

const DB_NAME = 'mdlr-highscores-photos'
const DB_VERSION = 1
const STORE = 'photos'

export type PhotoVariant = 'proof' | 'thumb'

interface PhotoRecord {
  id: string
  proof: Blob
  thumb: Blob
}

const urlCache = new Map<string, string>()

function cacheKey(id: string, variant: PhotoVariant) {
  return `${id}:${variant}`
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('IDB open failed'))
  })
}

function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('IDB request failed'))
  })
}

export function mockPhotoPath(id: string) {
  return `mock-photo:${id}`
}

export function isMockPhotoPath(
  path: string | null | undefined,
): path is string {
  return typeof path === 'string' && path.startsWith('mock-photo:')
}

export function mockPhotoId(path: string) {
  return path.slice('mock-photo:'.length)
}

export async function saveMockPhoto(
  id: string,
  proof: Blob,
  thumb: Blob,
): Promise<void> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readwrite')
    await idbRequest(tx.objectStore(STORE).put({ id, proof, thumb }, id))
  } finally {
    db.close()
  }
  rememberUrl(id, 'proof', proof)
  rememberUrl(id, 'thumb', thumb)
}

async function readRecord(id: string): Promise<PhotoRecord | null> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readonly')
    const record = await idbRequest(
      tx.objectStore(STORE).get(id) as IDBRequest<PhotoRecord | undefined>,
    )
    return record ?? null
  } finally {
    db.close()
  }
}

function rememberUrl(id: string, variant: PhotoVariant, blob: Blob) {
  const key = cacheKey(id, variant)
  const previous = urlCache.get(key)
  if (previous) URL.revokeObjectURL(previous)
  urlCache.set(key, URL.createObjectURL(blob))
}

/** Sync lookup used by HighscoresSource.photoUrl after hydration. */
export function cachedMockPhotoUrl(
  path: string | null,
  variant: PhotoVariant = 'thumb',
): string | null {
  if (!isMockPhotoPath(path)) return path
  return urlCache.get(cacheKey(mockPhotoId(path), variant)) ?? null
}

/** Loads object URLs from IndexedDB so photoUrl can stay synchronous. */
export async function hydrateMockPhoto(path: string): Promise<string | null> {
  if (!isMockPhotoPath(path)) return path
  const id = mockPhotoId(path)
  const cached = urlCache.get(cacheKey(id, 'thumb'))
  if (cached) return cached
  try {
    const record = await readRecord(id)
    if (!record) return null
    rememberUrl(id, 'proof', record.proof)
    rememberUrl(id, 'thumb', record.thumb)
    return urlCache.get(cacheKey(id, 'thumb')) ?? null
  } catch {
    return null
  }
}

export async function clearMockPhotos(): Promise<void> {
  for (const url of urlCache.values()) URL.revokeObjectURL(url)
  urlCache.clear()
  if (typeof indexedDB === 'undefined') return
  try {
    const db = await openDb()
    try {
      const tx = db.transaction(STORE, 'readwrite')
      await idbRequest(tx.objectStore(STORE).clear())
    } finally {
      db.close()
    }
  } catch {
    // Tests and SSR have no IndexedDB: nothing to clear.
  }
}
