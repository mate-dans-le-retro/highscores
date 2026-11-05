/** Proof kept for the admin (~2000 px) and thumbnail for the public screen (~800 px). */
export interface PreparedPhoto {
  proof: Blob
  thumb: Blob
}

/**
 * Shrinks a phone photo on its longest side. Full-size pictures weigh a lot on
 * the venue's wifi, and would fill any browser storage quickly.
 */
export async function resizePhoto(photo: Blob, maxSize = 800, quality = 0.7) {
  const bitmap = await createImageBitmap(photo)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('Could not encode the photo')),
      'image/jpeg',
      quality,
    )
  })
}

/**
 * The photo is the proof, so it is never refused: when the browser cannot
 * decode it (HEIC outside Safari), the original file is kept as both versions.
 */
export async function preparePhoto(photo: Blob): Promise<PreparedPhoto> {
  try {
    const [proof, thumb] = await Promise.all([
      resizePhoto(photo, 2000, 0.85),
      resizePhoto(photo, 800, 0.7),
    ])
    return { proof, thumb }
  } catch {
    return { proof: photo, thumb: photo }
  }
}
