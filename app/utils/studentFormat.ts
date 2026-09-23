import type { BookBrief } from '~/services/studentService'

/** "Cormen, Leiserson" style line for a book's authors. */
export function authorLine(book: Pick<BookBrief, 'authors'>): string {
  return book.authors.length ? book.authors.join(', ') : 'Unknown author'
}

/** "Due in 2 days" / "Due today" / "3 days overdue" for a loan's whole-day count. */
export function dueLabel(daysLeft: number): string {
  if (daysLeft < 0) return `${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? '' : 's'} overdue`
  if (daysLeft === 0) return 'Due today'
  return `Due in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
}

export function dueTone(daysLeft: number): 'bad' | 'warn' | 'good' {
  return daysLeft < 0 ? 'bad' : daysLeft <= 2 ? 'warn' : 'good'
}

/** "3 of 4 available" / "All out · 2 in queue" */
export function availabilityLabel(available: number, total: number, queue: number): string {
  if (available > 0) return `${available} of ${total} available`
  return queue > 0 ? `All out · ${queue} in queue` : 'All copies out'
}

export function initials(first: string, last: string): string {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

export function greeting(now: Date = new Date()): string {
  const hour = now.getHours()
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
}

/** Available / total (retired copies don't count) from a raw book's `copies`. */
export function copyCounts(copies: { status: string }[] | undefined): { available: number; total: number } {
  const live = (copies ?? []).filter((copy) => copy.status !== 'retired')
  return { available: live.filter((copy) => copy.status === 'available').length, total: live.length }
}

const pad = (n: number) => String(n).padStart(2, '0')
const localDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** The last seven days (oldest first), marking the ones with a recorded visit. */
export function lastSevenDays(visitedDates: string[], now: Date = new Date()): { label: string; visited: boolean; today: boolean }[] {
  const visited = new Set(visitedDates)

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now)
    day.setDate(now.getDate() - (6 - i))
    return {
      label: day.toLocaleDateString('en-US', { weekday: 'narrow' }),
      visited: visited.has(localDateKey(day)),
      today: i === 6,
    }
  })
}
