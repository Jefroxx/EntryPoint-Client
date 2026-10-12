import { BaseService } from "./BaseService";

export type StaffRole = "admin" | "librarian" | "assistant";
export type MemberKind = "faculty" | "staff";

export interface StaffAccount {
  uuid: string;
  firstName: string;
  middleInitial: string | null;
  lastName: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  role: StaffRole;
  roleLabel: string;
  isDisabled: boolean;
  /** The signed-in administrator's own account (it can't be disabled or demoted from here). */
  isYou: boolean;
  createdAt: string | null;
}

export interface MemberAccount {
  uuid: string;
  firstName: string;
  middleInitial: string | null;
  lastName: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  memberType: MemberKind;
  employeeIDNumber: string;
  department: string | null;
  barcodeValue: string | null;
  isDisabled: boolean;
  createdAt: string | null;
}

export interface AuditEntry {
  logID: number;
  actorID: number | null;
  actorName: string;
  actorRole: string;
  action: string;
  summary: string;
  created_at: string;
}

export interface AdminOverview {
  staff: { admin: number; librarian: number; assistant: number; disabled: number };
  members: { student: number; faculty: number; staff: number; disabled: number };
  pendingRegistrations: number;
  recentActivity: AuditEntry[];
}

export interface RoleRow {
  role: StaffRole;
  label: string;
  /** The administrator always has everything. */
  editable: boolean;
  permissions: string[];
}

export interface RolesOverview {
  permissions: { key: string; label: string }[];
  roles: RoleRow[];
}

export interface Page<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

export interface StaffPayload {
  firstName: string;
  middleInitial?: string | null;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  role: StaffRole;
}

export interface MemberPayload {
  firstName: string;
  middleInitial?: string | null;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  memberType: MemberKind;
  employeeIDNumber: string;
  department: string;
}

/** A new account comes with a temporary password, shown once for the administrator to hand over. */
export interface CreatedAccount<T> {
  account: T;
  temporaryPassword: string;
}

class AdminServiceClass extends BaseService {
  overview() {
    return this.apiRequest<AdminOverview>("/admin/overview");
  }

  // ---- staff
  staff(search?: string) {
    return this.apiRequest<{ staff: StaffAccount[] }>("/admin/staff", { query: { search: search || undefined } });
  }
  createStaff(payload: StaffPayload) {
    return this.apiRequest<CreatedAccount<StaffAccount>>("/admin/staff", { method: "POST", body: payload });
  }
  updateStaff(uuid: string, payload: Partial<StaffPayload>) {
    return this.apiRequest<{ account: StaffAccount }>(`/admin/staff/${uuid}`, { method: "PATCH", body: payload });
  }
  setStaffDisabled(uuid: string, disabled: boolean) {
    return this.apiRequest<{ message: string }>(`/admin/staff/${uuid}/${disabled ? "disable" : "enable"}`, { method: "POST" });
  }
  resetStaffPassword(uuid: string) {
    return this.apiRequest<{ temporaryPassword: string }>(`/admin/staff/${uuid}/reset-password`, { method: "POST" });
  }

  // ---- faculty and staff members
  members(query: { search?: string; type?: string; page?: number; perPage?: number } = {}) {
    return this.apiRequest<Page<MemberAccount>>("/admin/members", {
      query: { search: query.search || undefined, type: query.type || undefined, page: query.page, perPage: query.perPage },
    });
  }
  createMember(payload: MemberPayload) {
    return this.apiRequest<CreatedAccount<MemberAccount>>("/admin/members", { method: "POST", body: payload });
  }
  updateMember(uuid: string, payload: Partial<MemberPayload>) {
    return this.apiRequest<{ account: MemberAccount }>(`/admin/members/${uuid}`, { method: "PATCH", body: payload });
  }
  setMemberDisabled(uuid: string, disabled: boolean) {
    return this.apiRequest<{ message: string }>(`/admin/members/${uuid}/${disabled ? "disable" : "enable"}`, { method: "POST" });
  }
  resetMemberPassword(uuid: string) {
    return this.apiRequest<{ temporaryPassword: string }>(`/admin/members/${uuid}/reset-password`, { method: "POST" });
  }

  // ---- roles and the audit log
  roles() {
    return this.apiRequest<RolesOverview>("/admin/roles");
  }
  saveRole(role: StaffRole, permissions: string[]) {
    return this.apiRequest<RolesOverview>(`/admin/roles/${role}`, { method: "PUT", body: { permissions } });
  }
  auditLogs(query: { search?: string; area?: string; page?: number } = {}) {
    return this.apiRequest<{ areas: Record<string, string>; logs: Page<AuditEntry> }>("/admin/audit-logs", {
      query: { search: query.search || undefined, area: query.area || undefined, page: query.page },
    });
  }
}

export const adminService = new AdminServiceClass();
