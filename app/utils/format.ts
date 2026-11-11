/**
 * How the app writes dates, times and money. Every screen goes through these (they are auto-imported), so a date reads
 * the same everywhere and never follows whatever language a computer happens to be set to.
 *
 * A date that is only READ is written as text here. A date that is ENTERED is picked from a calendar
 * (see LibrarianTextField type="date" and DayPicker).
 */
type DateLike = string | Date

const asDate = (value: DateLike) => (value instanceof Date ? value : new Date(value))

/** "Nov 11, 2026" */
export function formatDate(value: DateLike): string {
  return asDate(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** "Wednesday, November 11, 2026": page headings that say which day a list is about. */
export function formatLongDate(value: DateLike): string {
  return asDate(value).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

/** "Nov 11, 2026 · 3:05 PM" */
export function formatDateTime(value: DateLike): string {
  const date = asDate(value)
  const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${day} · ${time}`
}

/** "3:05 PM" */
export function formatTime(value: DateLike): string {
  return asDate(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/** "42m" / "1h 27m" between two timestamps; an open end runs up to `nowMs`. */
export function formatDuration(start: string, end: string | null, nowMs: number = Date.now()): string {
  const endMs = end ? new Date(end).getTime() : nowMs
  const minutes = Math.max(0, Math.round((endMs - new Date(start).getTime()) / 60000))
  return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString()
}

/** A day as "2026-11-11" in the computer's own time zone (toISOString is UTC, which can land on the wrong day in the evening). */
export function toYmd(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** "Just now", "12 min ago", "3 hr ago", "Yesterday", then a plain date. */
export function timeAgo(value: string, nowMs: number = Date.now()): string {
  const date = new Date(value)
  const minutes = Math.floor((nowMs - date.getTime()) / 60000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  if (isSameDay(date, new Date(nowMs))) return `${Math.floor(minutes / 60)} hr ago`

  const yesterday = new Date(nowMs)
  yesterday.setDate(yesterday.getDate() - 1)
  return isSameDay(date, yesterday) ? 'Yesterday' : formatDate(value)
}

/** "₱1,250.00": always two decimals. */
export function formatPeso(amount: number | string): string {
  return `₱${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function personName(user: { firstName: string; lastName: string } | null | undefined): string {
  return user ? `${user.firstName} ${user.lastName}` : 'Unknown student'
}
