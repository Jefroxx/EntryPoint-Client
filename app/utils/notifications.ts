export type NotificationTone = 'accent' | 'success' | 'warning' | 'info' | 'neutral'

export interface NotificationMeta {
  icon: string
  tone: NotificationTone
  action?: string
  to?: string
}

const REDEMPTION: NotificationMeta = { icon: 'i-tabler-gift', tone: 'success', action: 'Fulfill', to: '/librarian/engagement?tab=redemptions' }

// The notification types librarians actually receive, and where each one should lead.
const META: Record<string, NotificationMeta> = {
  new_registration: { icon: 'i-tabler-user-plus', tone: 'accent', action: 'Review', to: '/librarian/students?tab=pending' },
  new_book_suggestion: { icon: 'i-tabler-bulb', tone: 'accent', action: 'Review', to: '/librarian/library?tab=requests' },
  self_return_reported: { icon: 'i-tabler-arrow-back-up', tone: 'warning', action: 'Verify', to: '/librarian/circulation?tab=selfreturn' },
  new_reservation: { icon: 'i-tabler-bookmark', tone: 'info', action: 'Open', to: '/librarian/circulation?tab=reservations' },
  new_redemption: REDEMPTION,
  redemption_requested: REDEMPTION,
}

export function notificationMeta(type: string | null): NotificationMeta {
  return META[type ?? ''] ?? { icon: 'i-tabler-bell', tone: 'neutral' }
}
