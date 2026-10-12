import { BaseService } from "./BaseService";

export type AnnouncementAudience = "everyone" | "students" | "staff";

export interface Announcement {
  uuid: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  expiresAt: string | null;
  /** False once its end date has passed. */
  isActive: boolean;
  createdAt: string | null;
}

export interface AnnouncementPayload {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  expiresAt: string | null;
}

class AnnouncementServiceClass extends BaseService {
  /** The active notices for the student side (students, faculty and staff members). */
  forStudents() {
    return this.apiRequest<{ announcements: Announcement[] }>("/student/announcements");
  }

  /** The active notices for the librarian side. */
  forStaff() {
    return this.apiRequest<{ announcements: Announcement[] }>("/librarian/announcements");
  }

  // ---- the administrator's
  all() {
    return this.apiRequest<{ announcements: Announcement[] }>("/admin/announcements");
  }
  create(payload: AnnouncementPayload) {
    return this.apiRequest<{ announcement: Announcement }>("/admin/announcements", { method: "POST", body: payload });
  }
  update(uuid: string, payload: AnnouncementPayload) {
    return this.apiRequest<{ announcement: Announcement }>(`/admin/announcements/${uuid}`, { method: "PATCH", body: payload });
  }
  remove(uuid: string) {
    return this.apiRequest<{ message: string }>(`/admin/announcements/${uuid}`, { method: "DELETE" });
  }
}

export const announcementService = new AnnouncementServiceClass();
