import { afterEach, describe, expect, it, vi } from 'vitest'

import { randomUuid } from './random-uuid'

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('randomUuid', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses crypto.randomUUID when the page is a secure context', () => {
    expect(randomUuid()).toMatch(UUID_V4)
  })

  it('still works over plain HTTP, where crypto.randomUUID is missing', () => {
    const secure = globalThis.crypto
    vi.stubGlobal('crypto', {
      getRandomValues: (array: Uint8Array<ArrayBuffer>) =>
        secure.getRandomValues(array),
    })
    const ids = new Set(Array.from({ length: 50 }, () => randomUuid()))
    expect(ids.size).toBe(50)
    for (const id of ids) expect(id).toMatch(UUID_V4)
  })
})
