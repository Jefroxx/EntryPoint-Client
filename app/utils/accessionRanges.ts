/**
 * Reads what a librarian types to choose copies by accession number: "1-20, 25, 30-35". Ranges are "from-to"
 * (a dash, en dash, or the word "to" all work); a single number is one copy. Separators are commas, semicolons or spaces.
 */
export interface AccessionRange {
  from: number
  to: number
}

export const MAX_ACCESSION_RANGES = 200

/** Squeezes a list of accession numbers into runs: [380, 381, 382, 390] becomes 380-382 and 390. */
export function toRanges(numbers: number[]): AccessionRange[] {
  const sorted = [...new Set(numbers)].sort((a, b) => a - b)
  const ranges: AccessionRange[] = []

  for (const n of sorted) {
    const last = ranges[ranges.length - 1]
    if (last && n === last.to + 1) last.to = n
    else ranges.push({ from: n, to: n })
  }

  return ranges
}

/** "380-382, 390": a list of accession numbers as it reads to a person. */
export const describeRanges = (ranges: AccessionRange[]) => ranges.map((r) => (r.from === r.to ? `${r.from}` : `${r.from}-${r.to}`)).join(', ')

export function parseAccessionRanges(text: string): { ranges: AccessionRange[]; error: string } {
  const cleaned = text
    .replace(/\s+to\s+/gi, '-')
    .replace(/\s*[-–—]\s*/g, '-')
    .trim()

  if (!cleaned) return { ranges: [], error: '' }

  const ranges: AccessionRange[] = []

  for (const token of cleaned.split(/[,;\s]+/).filter(Boolean)) {
    const single = /^\d+$/.exec(token)
    const range = /^(\d+)-(\d+)$/.exec(token)

    if (single) {
      const n = Number(single[0])
      if (n < 1) return { ranges: [], error: 'Accession numbers start at 1.' }
      ranges.push({ from: n, to: n })
    } else if (range) {
      const from = Number(range[1])
      const to = Number(range[2])
      if (from < 1) return { ranges: [], error: 'Accession numbers start at 1.' }
      if (from > to) return { ranges: [], error: `"${token}" runs backwards: put the smaller number first.` }
      ranges.push({ from, to })
    } else {
      return { ranges: [], error: `"${token}" isn't a number or a range like 1-20.` }
    }
  }

  if (ranges.length > MAX_ACCESSION_RANGES) return { ranges: [], error: `That is more than ${MAX_ACCESSION_RANGES} numbers or ranges. Use fewer ranges.` }

  return { ranges, error: '' }
}
