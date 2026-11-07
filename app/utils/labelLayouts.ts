/**
 * Where barcode labels go on a sheet. Every size is in millimetres so what is previewed is what is printed.
 * "Plain paper" prints a grid with cut lines on ordinary paper; the sticker layouts match common A4 label sheets
 * (the numbers are those sheets' printed specs: check yours, and use "Start at" to reuse a partly used sheet).
 */
export type LabelLayoutKey = 'plain' | 'sticker24' | 'sticker65'
export type PaperKey = 'a4' | 'letter'

export interface LabelLayout {
  key: LabelLayoutKey
  name: string
  hint: string
  cols: number
  /** Fixed rows; plain paper fits as many as the paper's height allows (see rowsFor). */
  rows: number
  /** One label's width and height, mm. */
  w: number
  h: number
  /** Space from the paper's left and top edge to the first label, mm. */
  left: number
  top: number
  /** Gaps between labels, mm. */
  gapX: number
  gapY: number
  /** Draws a thin border so a plain sheet can be cut up. */
  cutLines: boolean
  /** Which type scale the label uses. */
  size: 'xs' | 'sm' | 'md'
  /** Sticker sheets are A4; plain paper can be A4 or short bond. */
  paperChoice: boolean
}

export const PAPERS: Record<PaperKey, { name: string; w: number; h: number }> = {
  a4: { name: 'A4', w: 210, h: 297 },
  letter: { name: 'Short bond (8.5 × 11 in)', w: 215.9, h: 279.4 },
}

export const LABEL_LAYOUTS: Record<LabelLayoutKey, LabelLayout> = {
  plain: {
    key: 'plain', name: 'Plain paper', hint: '4 across, cut lines, any printer paper',
    cols: 4, rows: 10, w: 50, h: 27, left: 5, top: 8, gapX: 0, gapY: 0, cutLines: true, size: 'sm', paperChoice: true,
  },
  sticker24: {
    key: 'sticker24', name: 'Sticker sheet, 24 labels', hint: '3 × 8, 63.5 × 33.9 mm',
    cols: 3, rows: 8, w: 63.5, h: 33.9, left: 7.2, top: 12.9, gapX: 2.5, gapY: 0, cutLines: false, size: 'md', paperChoice: false,
  },
  sticker65: {
    key: 'sticker65', name: 'Small stickers, 65 labels', hint: '5 × 13, 38.1 × 21.2 mm',
    cols: 5, rows: 13, w: 38.1, h: 21.2, left: 4.7, top: 10.7, gapX: 2.5, gapY: 0, cutLines: false, size: 'xs', paperChoice: false,
  },
}

/** How many rows fit: fixed for a sticker sheet, as many as the paper allows for plain paper. */
export function rowsFor(layout: LabelLayout, paper: PaperKey): number {
  if (!layout.paperChoice) return layout.rows
  return Math.max(1, Math.floor((PAPERS[paper].h - layout.top * 2) / layout.h))
}

export const labelsPerPage = (layout: LabelLayout, paper: PaperKey) => layout.cols * rowsFor(layout, paper)

/**
 * Splits labels into sheets. `skip` leaves that many empty places at the start of the first sheet, so a partly
 * used sticker sheet can go back in the printer.
 */
export function paginateLabels<T>(items: T[], perPage: number, skip: number): (T | null)[][] {
  const cells: (T | null)[] = [...Array<null>(Math.max(0, Math.min(skip, perPage - 1))).fill(null), ...items]
  const pages: (T | null)[][] = []
  for (let i = 0; i < cells.length; i += perPage) pages.push(cells.slice(i, i + perPage))
  return pages
}
