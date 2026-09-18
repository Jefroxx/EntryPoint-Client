import { notificationService, type NotificationRecord } from '~/services/notificationService'

let latestRequest = 0

// One list shared by the header bell and the Notifications page, so reading a
// notification in either place updates both.
export function useNotifications() {
  const items = useState<NotificationRecord[]>('librarian-notifications', () => [])
  const loaded = useState('librarian-notifications-loaded', () => false)

  const unreadCount = computed(() => items.value.filter((n) => !n.isRead).length)

  async function refresh() {
    // Only the newest request may write, so a slow poll can't overwrite a
    // fresher result (or an optimistic "read" flip) with stale data.
    const request = ++latestRequest

    try {
      const { notifications } = await notificationService.fetchNotifications()
      if (request === latestRequest) items.value = notifications
    } catch {
      // Keep the list we already have; the next poll tries again.
    } finally {
      if (request === latestRequest) loaded.value = true
    }
  }

  async function markRead(notification: NotificationRecord) {
    if (notification.isRead) return

    notification.isRead = true
    try {
      await notificationService.markRead(notification.notificationID)
    } catch (error) {
      notification.isRead = false
      throw error
    }
    void refresh()
  }

  async function markAllRead() {
    const previous = items.value.map((n) => n.isRead)
    items.value.forEach((n) => { n.isRead = true })

    try {
      await notificationService.markAllRead()
    } catch (error) {
      items.value.forEach((n, i) => { n.isRead = previous[i]! })
      throw error
    }
    void refresh()
  }

  return { items, loaded, unreadCount, refresh, markRead, markAllRead }
}
