import { BaseService } from "./BaseService";

export interface NotificationRecord {
  notificationID: number;
  uuid: string;
  message: string;
  type: string | null;
  sentAt: string;
  isRead: boolean;
}

class NotificationServiceClass extends BaseService {
  fetchNotifications() {
    return this.apiRequest<{ notifications: NotificationRecord[]; unreadCount: number }>("/notifications");
  }

  markRead(notificationUuid: string) {
    return this.apiRequest<{ message: string }>(`/notifications/${notificationUuid}/read`, { method: "PATCH" });
  }

  markAllRead() {
    return this.apiRequest<{ message: string }>("/notifications/read-all", { method: "PATCH" });
  }
}

export const notificationService = new NotificationServiceClass();
