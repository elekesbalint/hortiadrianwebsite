'use client'

/** Banner/hero képhez: max szélesség, minőség. */
const MAX_WIDTH = 1920
const MAX_HEIGHT = 1080
const JPEG_QUALITY = 0.88

/**
 * Kép átméretezése és tömörítése (canvas) – ne legyen pixeles, de ne legyen óriási fájl.
 * Visszaad egy új File-t (jpeg), vagy null ha hiba.
 */
export function optimizeImageForBanner(file: File): Promise<File | null> {
  return new Promise((resolve) => {
    const img = document.createElement('img')
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const w = img.naturalWidth
      const h = img.naturalHeight
      if (w <= 0 || h <= 0) {
        resolve(null)
        return
      }
      let targetW = w
      let targetH = h
      if (w > MAX_WIDTH || h > MAX_HEIGHT) {
        const rW = MAX_WIDTH / w
        const rH = MAX_HEIGHT / h
        const r = Math.min(rW, rH, 1)
        targetW = Math.round(w * r)
        targetH = Math.round(h * r)
      }
      const canvas = document.createElement('canvas')
      canvas.width = targetW
      canvas.height = targetH
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(null)
        return
      }
      ctx.drawImage(img, 0, 0, targetW, targetH)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null)
            return
          }
          const name = file.name.replace(/\.[^.]+$/, '') || 'banner'
          const out = new File([blob], `${name}.jpg`, { type: 'image/jpeg' })
          resolve(out)
        },
        'image/jpeg',
        JPEG_QUALITY
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    img.src = url
  })
}
