/** Photos of a book's reference pages, so students can look inside before borrowing (server: BookPageService). */

export type BookPageSection = 'table_of_contents' | 'appendix' | 'bibliography' | 'index' | 'about_the_author'

export interface BookPagePhoto {
  pageID: number
  section: BookPageSection
  position: number
  url: string
}

/** In the order they appear in a book, which is also the order they're shown in. */
export const BOOK_PAGE_SECTIONS: { key: BookPageSection; label: string; icon: string }[] = [
  { key: 'table_of_contents', label: 'Table of contents', icon: 'i-tabler-list-numbers' },
  { key: 'appendix', label: 'Appendix', icon: 'i-tabler-paperclip' },
  { key: 'bibliography', label: 'Bibliography', icon: 'i-tabler-quote' },
  { key: 'index', label: 'Index', icon: 'i-tabler-list-search' },
  { key: 'about_the_author', label: 'About the author', icon: 'i-tabler-user-circle' },
]

/** Mirrors BookPageService::MAX_PER_SECTION. */
export const MAX_PAGES_PER_SECTION = 20

/** Long side of an uploaded page photo: small print on a phone photo of a page stays readable at this size. */
const MAX_SIDE = 1800

/**
 * Shrinks a phone photo (often 3–5 MB, 4000 px) to a JPEG around a few hundred KB before it's uploaded.
 * The server has no image library, so this is the only resize. EXIF rotation is applied, so a page shot
 * sideways isn't stored sideways.
 */
export async function compressPagePhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')!
  context.fillStyle = '#fff' // a transparent PNG becomes white paper, not black
  context.fillRect(0, 0, width, height)
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not read that photo.'))), 'image/jpeg', 0.85)
  })
}
