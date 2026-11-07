import type { ReservationStatus } from '~/services/circulationService'

/** What each reservation state is called at the desk, and the colors of its little status line (cards and pop-up share it). */
export const reservationLook: Record<ReservationStatus, { label: string; short: string; text: string; dot: string }> = {
  Waiting: { label: 'Waiting for review', short: 'Waiting', text: 'text-amber-700', dot: 'bg-amber-500' },
  Accepted: { label: 'Ready for pickup', short: 'Ready', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Rejected: { label: 'Rejected', short: 'Rejected', text: 'text-red-600', dot: 'bg-red-500' },
  Fulfilled: { label: 'Checked out', short: 'Checked out', text: 'text-stone-500', dot: 'bg-stone-400' },
}

/** "Jane Doe, John Roe" for a reserved book; empty when its authors aren't known. */
export function reservedAuthors(book: { authorNames?: string[] } | null | undefined): string {
  return (book?.authorNames ?? []).join(', ')
}

/** "3 of 4 copies free" or, when none are, "No copies free (4 in total)". */
export function copiesFreeLine(copiesFree?: number, copiesTotal?: number): string {
  if (copiesTotal === undefined) return ''
  if (copiesFree) return `${copiesFree} of ${copiesTotal} ${copiesTotal === 1 ? 'copy' : 'copies'} free`
  return `No copies free (${copiesTotal} in total)`
}
