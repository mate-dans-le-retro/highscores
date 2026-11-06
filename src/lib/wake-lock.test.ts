import { afterEach, describe, expect, it, vi } from 'vitest'

import type { WakeLockApi } from './wake-lock'
import { acquireScreenWakeLock, releaseScreenWakeLock } from './wake-lock'

function fakeSentinel(
  overrides: Partial<WakeLockSentinel> = {},
): WakeLockSentinel {
  return {
    type: 'screen',
    released: false,
    onrelease: null,
    release: vi.fn(async () => {
      // WakeLockSentinel.release() resolves to void.
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
    ...overrides,
  } as WakeLockSentinel
}

describe('acquireScreenWakeLock', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns null when the API is missing', async () => {
    expect(await acquireScreenWakeLock(null)).toBeNull()
    expect(await acquireScreenWakeLock(undefined)).toBeNull()
  })

  it('returns null when the page is hidden', async () => {
    vi.stubGlobal('document', { visibilityState: 'hidden' })
    const request = vi.fn()
    const api: WakeLockApi = { request }
    expect(await acquireScreenWakeLock(api)).toBeNull()
    expect(request).not.toHaveBeenCalled()
  })

  it('returns the sentinel when the request succeeds', async () => {
    vi.stubGlobal('document', { visibilityState: 'visible' })
    const sentinel = fakeSentinel()
    const api: WakeLockApi = {
      request: vi.fn(async () => sentinel),
    }
    expect(await acquireScreenWakeLock(api)).toBe(sentinel)
    expect(api.request).toHaveBeenCalledWith('screen')
  })

  it('returns null when permission is denied', async () => {
    vi.stubGlobal('document', { visibilityState: 'visible' })
    const api: WakeLockApi = {
      request: vi.fn(async () => {
        throw new DOMException('Permission denied', 'NotAllowedError')
      }),
    }
    expect(await acquireScreenWakeLock(api)).toBeNull()
  })

  it('returns null on any other request error', async () => {
    vi.stubGlobal('document', { visibilityState: 'visible' })
    const api: WakeLockApi = {
      request: vi.fn(async () => {
        throw new Error('boom')
      }),
    }
    expect(await acquireScreenWakeLock(api)).toBeNull()
  })
})

describe('releaseScreenWakeLock', () => {
  it('ignores a missing sentinel', async () => {
    await expect(releaseScreenWakeLock(null)).resolves.toBeUndefined()
    await expect(releaseScreenWakeLock(undefined)).resolves.toBeUndefined()
  })

  it('skips release when already released', async () => {
    const release = vi.fn(async () => {})
    const sentinel = fakeSentinel({ released: true, release })
    await releaseScreenWakeLock(sentinel)
    expect(release).not.toHaveBeenCalled()
  })

  it('releases an active sentinel', async () => {
    const release = vi.fn(async () => {})
    const sentinel = fakeSentinel({ release })
    await releaseScreenWakeLock(sentinel)
    expect(release).toHaveBeenCalledOnce()
  })

  it('swallows release errors', async () => {
    const sentinel = fakeSentinel({
      release: vi.fn(async () => {
        throw new Error('already gone')
      }),
    })
    await expect(releaseScreenWakeLock(sentinel)).resolves.toBeUndefined()
  })
})
