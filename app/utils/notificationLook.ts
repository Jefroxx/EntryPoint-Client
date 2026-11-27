import type { NotificationRecord } from '~/services/notificationService'
import { notificationMeta } from '~/utils/notifications'
import { studentNotificationMeta } from '~/utils/studentNotifications'

/** The tone of a notification's icon tile, the same names for both sides. */
export type NotificationLookTone = 'accent' | 'good' | 'warn' | 'bad' | 'info' | 'neutral'

const STAFF_TONE: Record<string, NotificationLookTone> = { accent: 'accent', success: 'good', warning: 'warn', info: 'info', neutral: 'neutral' }

/**
 * Each side's own list of notice types (utils/notifications.ts for staff, utils/studentNotifications.ts for students)
 * in one shape: an icon, a tone, where it leads and what its button says.
 */
export function notificationLook(item: NotificationRecord, side: 'student' | 'staff'): { icon: string; tone: NotificationLookTone; to?: string; action: string } {
  if (side === 'student') {
    const m = studentNotificationMeta(item.type)
    return { icon: m.icon, tone: m.tone, to: m.to, action: 'View' }
  }
  const m = notificationMeta(item.type)
  return { icon: m.icon, tone: STAFF_TONE[m.tone] ?? 'neutral', to: m.to, action: m.action ?? 'Open' }
}

export const NOTIFICATION_TONES: Record<NotificationLookTone, string> = {
  accent: 'bg-accent-100 text-accent-600',
  good: 'bg-emerald-100 text-emerald-600',
  warn: 'bg-amber-100 text-amber-600',
  bad: 'bg-red-100 text-red-600',
  info: 'bg-sky-100 text-sky-600',
  neutral: 'bg-stone-100 text-stone-500',
}
