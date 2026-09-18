import { BaseService } from "./BaseService";

export interface NotificationRecord {
  notificationID: number;
  message: string;
  type: string | null;
  sentAt: string;
  isRead: boolean;
}

class NotificationServiceClass extends BaseService {
  fetchNotifications() {
    return this.apiRequest<{ notifications: NotificationRecord[]; unreadCount: number }>("/notifications");
  }

  markRead(notificationID: number) {
    return this.apiRequest<{ message: string }>(`/notifications/${notificationID}/read`, { method: "PATCH" });
  }

  markAllRead() {
    return this.apiRequest<{ message: string }>("/notifications/read-all", { method: "PATCH" });
  }
}

export const notificationService = new NotificationServiceClass();
