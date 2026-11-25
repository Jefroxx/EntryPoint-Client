/**
 * Colors for "students by program". Validated categorical order (brand brown first); "Other" and "Not set" are not
 * programs, so they stay neutral and never use up a program's color.
 */
const PROGRAM_COLORS = ['#532c2e', '#1e423f', '#a97954', '#c29b87', '#839795']
const NEUTRAL: Record<string, string> = { 'Other': '#a8a29e', 'Not set': '#d6d3d1' }

interface Slice { label: string; count: number }

/** The collection's copy states, in one place so the Dashboard and Reports show the same colors. */
export const COPY_STATE_COLORS = { available: '#059669', borrowed: '#532c2e', damaged: '#d97706', lostOrRetired: '#a8a29e' } as const

/**
 * Gives each slice its color. The color follows the program, not its rank: the slots come from the all-students
 * ranking (`reference`), so a program keeps its color when you switch to another view. A program only the other
 * view has takes the next free color.
 */
export function colorProgramSlices<T extends Slice>(slices: T[], reference: Slice[]): (T & { color: string })[] {
  const assigned = new Map<string, string>()
  for (const slice of reference) {
    if (!NEUTRAL[slice.label] && assigned.size < PROGRAM_COLORS.length) assigned.set(slice.label, PROGRAM_COLORS[assigned.size]!)
  }

  const used = new Set(assigned.values())
  const spare = PROGRAM_COLORS.filter((color) => !used.has(color))

  return slices.map((slice) => ({
    ...slice,
    color: NEUTRAL[slice.label] ?? assigned.get(slice.label) ?? spare.shift() ?? NEUTRAL.Other!,
  }))
}
