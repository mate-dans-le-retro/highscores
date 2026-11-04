/**
 * Shrinks a phone photo before storing it: full-size pictures would fill the
 * mock's localStorage quickly, and weigh a lot on the venue's wifi.
 */
export async function resizePhoto(photo: Blob, maxWidth = 800, quality = 0.7) {
  const bitmap = await createImageBitmap(photo)
  const scale = Math.min(1, maxWidth / bitmap.width)
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
 * decode it (HEIC outside Safari), the original file is kept as is.
 */
export async function preparePhoto(photo: Blob) {
  try {
    return await resizePhoto(photo)
  } catch {
    return photo
  }
}
