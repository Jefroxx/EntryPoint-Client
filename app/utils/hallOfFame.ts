import type { HallOfFameCategory } from '~/services/studentService'

export const HALL_OF_FAME_PERIOD: Record<HallOfFameCategory['period'], string> = {
  month: 'This month',
  now: 'Right now',
  all: 'All time',
}

/** Place medals: gold (oak) for first, silver for second, bronze (leather) for third. */
export const HALL_OF_FAME_MEDAL: Record<number, string> = {
  1: 'bg-highlight-500 text-white',
  2: 'bg-stone-300 text-stone-700',
  3: 'bg-leather text-white',
}

/** 7 → "7 days", 1 → "1 day", 10.3 → "10.3 hours". */
export function hallOfFameAmount(value: number, unit: string): string {
  const shown = Number.isInteger(value) ? String(value) : value.toFixed(1)
  return `${shown} ${value === 1 ? unit : `${unit}s`}`
}
