export type StudentTone = 'good' | 'warn' | 'bad' | 'accent' | 'neutral'

export interface StudentNotificationMeta {
  icon: string
  tone: StudentTone
  /** Where tapping the notification leads, if anywhere useful. */
  to?: string
}

const BOOKS = '/student/books'
// Loan links name their tab: My books opens on Reservations by default.
const LOANS = `${BOOKS}?tab=loans`

// The notification types students actually receive, and where each should lead.
const META: Record<string, StudentNotificationMeta> = {
  registration_approved: { icon: 'i-tabler-rosette-discount-check', tone: 'good', to: '/student/id' },
  registration_rejected: { icon: 'i-tabler-circle-x', tone: 'bad' },
  reservation_accepted: { icon: 'i-tabler-check', tone: 'good', to: `${BOOKS}?tab=reservations` },
  reservation_rejected: { icon: 'i-tabler-circle-x', tone: 'bad', to: `${BOOKS}?tab=reservations` },
  reservation_submitted: { icon: 'i-tabler-clock', tone: 'warn', to: `${BOOKS}?tab=reservations` },
  loan_checkout: { icon: 'i-tabler-book', tone: 'accent', to: LOANS },
  loan_due_soon: { icon: 'i-tabler-clock', tone: 'warn', to: LOANS },
  loan_overdue: { icon: 'i-tabler-alert-circle', tone: 'bad', to: LOANS },
  loan_returned: { icon: 'i-tabler-arrow-back-up', tone: 'good', to: LOANS },
  self_return_verified: { icon: 'i-tabler-check', tone: 'good', to: LOANS },
  self_return_rejected: { icon: 'i-tabler-circle-x', tone: 'bad', to: LOANS },
  penalty_settled: { icon: 'i-tabler-receipt', tone: 'good', to: `${BOOKS}?tab=fines` },
  achievement_unlocked: { icon: 'i-tabler-trophy', tone: 'accent', to: '/student/profile?tab=achievements' },
  achievement_redeemed: { icon: 'i-tabler-trophy', tone: 'good', to: '/student/profile?tab=history' },
  redemption_requested: { icon: 'i-tabler-gift', tone: 'warn', to: '/student/profile?tab=history' },
  redemption_fulfilled: { icon: 'i-tabler-gift', tone: 'good', to: '/student/profile?tab=history' },
  redemption_cancelled: { icon: 'i-tabler-circle-x', tone: 'bad', to: '/student/profile?tab=history' },
  book_suggestion_approved: { icon: 'i-tabler-bulb', tone: 'good', to: '/student/suggest' },
  book_suggestion_rejected: { icon: 'i-tabler-bulb', tone: 'neutral', to: '/student/suggest' },
  resource_session_started: { icon: 'i-tabler-device-desktop', tone: 'accent', to: '/student/facilities' },
  resource_session_ended: { icon: 'i-tabler-device-desktop', tone: 'neutral', to: '/student/facilities' },
}

export function studentNotificationMeta(type: string | null): StudentNotificationMeta {
  return META[type ?? ''] ?? { icon: 'i-tabler-bell', tone: 'neutral' }
}

/** Shared tone → class maps so pills, icon tiles and notices stay consistent. */
export const TONE_SOFT: Record<StudentTone, string> = {
  good: 'bg-emerald-50 text-emerald-700',
  warn: 'bg-amber-50 text-amber-700',
  bad: 'bg-red-50 text-red-600',
  accent: 'bg-accent-100 text-accent-600',
  neutral: 'bg-stone-100 text-stone-500',
}
