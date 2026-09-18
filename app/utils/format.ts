export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(value: string): string {
  const date = new Date(value)
  const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${day} · ${time}`
}

export function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
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

export function formatPeso(amount: number | string): string {
  return `₱${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function personName(user: { firstName: string; lastName: string } | null | undefined): string {
  return user ? `${user.firstName} ${user.lastName}` : 'Unknown student'
}
