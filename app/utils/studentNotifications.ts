export type StudentTone = 'good' | 'warn' | 'bad' | 'accent' | 'neutral'

export interface StudentNotificationMeta {
  icon: string
  tone: StudentTone
  /** Where tapping the notification leads, if anywhere useful. */
  to?: string
}

const BOOKS = '/student/books'

// The notification types students actually receive, and where each should lead.
const META: Record<string, StudentNotificationMeta> = {
  registration_approved: { icon: 'i-lucide-badge-check', tone: 'good', to: '/student/id' },
  registration_rejected: { icon: 'i-lucide-circle-x', tone: 'bad' },
  reservation_accepted: { icon: 'i-lucide-check', tone: 'good', to: `${BOOKS}?tab=reservations` },
  reservation_rejected: { icon: 'i-lucide-circle-x', tone: 'bad', to: `${BOOKS}?tab=reservations` },
  reservation_submitted: { icon: 'i-lucide-clock', tone: 'warn', to: `${BOOKS}?tab=reservations` },
  loan_checkout: { icon: 'i-lucide-book-open', tone: 'accent', to: BOOKS },
  loan_due_soon: { icon: 'i-lucide-clock', tone: 'warn', to: BOOKS },
  loan_overdue: { icon: 'i-lucide-circle-alert', tone: 'bad', to: BOOKS },
  loan_returned: { icon: 'i-lucide-undo-2', tone: 'good', to: BOOKS },
  self_return_verified: { icon: 'i-lucide-check', tone: 'good', to: BOOKS },
  self_return_rejected: { icon: 'i-lucide-circle-x', tone: 'bad', to: BOOKS },
  penalty_settled: { icon: 'i-lucide-receipt', tone: 'good', to: `${BOOKS}?tab=fines` },
  achievement_unlocked: { icon: 'i-lucide-trophy', tone: 'accent', to: '/student/rewards' },
  achievement_redeemed: { icon: 'i-lucide-trophy', tone: 'good', to: '/student/rewards' },
  redemption_requested: { icon: 'i-lucide-gift', tone: 'warn', to: '/student/rewards' },
  redemption_fulfilled: { icon: 'i-lucide-gift', tone: 'good', to: '/student/rewards' },
  redemption_cancelled: { icon: 'i-lucide-circle-x', tone: 'bad', to: '/student/rewards' },
  book_suggestion_approved: { icon: 'i-lucide-lightbulb', tone: 'good', to: '/student/suggest' },
  book_suggestion_rejected: { icon: 'i-lucide-lightbulb', tone: 'neutral', to: '/student/suggest' },
  resource_session_started: { icon: 'i-lucide-monitor', tone: 'accent', to: '/student/spaces' },
  resource_session_ended: { icon: 'i-lucide-monitor', tone: 'neutral', to: '/student/spaces' },
}

export function studentNotificationMeta(type: string | null): StudentNotificationMeta {
  return META[type ?? ''] ?? { icon: 'i-lucide-bell', tone: 'neutral' }
}

/** Shared tone → class maps so pills, icon tiles and notices stay consistent. */
export const TONE_SOFT: Record<StudentTone, string> = {
  good: 'bg-emerald-50 text-emerald-700',
  warn: 'bg-amber-50 text-amber-700',
  bad: 'bg-red-50 text-red-600',
  accent: 'bg-accent-100 text-accent-600',
  neutral: 'bg-stone-100 text-stone-500',
}
