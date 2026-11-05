import { describe, expect, it } from 'vitest'

import { isHeifPath } from './readable-photo'

describe('isHeifPath', () => {
  it('spots HEIC kept as is in the bucket', () => {
    expect(isHeifPath('https://x.supabase.co/photos/submissions/a.heic')).toBe(
      true,
    )
    expect(isHeifPath('https://x.supabase.co/photos/admin/a.HEIF?t=1')).toBe(
      true,
    )
  })

  it('leaves converted photos alone', () => {
    expect(isHeifPath('https://x.supabase.co/photos/submissions/a.jpg')).toBe(
      false,
    )
    expect(isHeifPath('https://x.supabase.co/heic/a.thumb.jpg')).toBe(false)
  })
})
