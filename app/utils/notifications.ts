export type NotificationTone = 'accent' | 'success' | 'warning' | 'info' | 'neutral'

export interface NotificationMeta {
  icon: string
  tone: NotificationTone
  action?: string
  to?: string
}

const REDEMPTION: NotificationMeta = { icon: 'i-lucide-gift', tone: 'success', action: 'Fulfill', to: '/librarian/engagement?tab=redemptions' }

// The notification types librarians actually receive, and where each one should lead.
const META: Record<string, NotificationMeta> = {
  new_registration: { icon: 'i-lucide-user-plus', tone: 'accent', action: 'Review', to: '/librarian/students?tab=pending' },
  new_book_suggestion: { icon: 'i-lucide-lightbulb', tone: 'accent', action: 'Review', to: '/librarian/library?tab=requests' },
  self_return_reported: { icon: 'i-lucide-undo-2', tone: 'warning', action: 'Verify', to: '/librarian/circulation?tab=selfreturn' },
  new_reservation: { icon: 'i-lucide-bookmark', tone: 'info', action: 'Open', to: '/librarian/circulation?tab=reservations' },
  new_redemption: REDEMPTION,
  redemption_requested: REDEMPTION,
}

export function notificationMeta(type: string | null): NotificationMeta {
  return META[type ?? ''] ?? { icon: 'i-lucide-bell', tone: 'neutral' }
}
