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

/** One line of an import file, as the server expects it. */
export interface ImportRow {
  type: string;
  idNumber: string;
  firstName: string;
  middleInitial: string;
  lastName: string;
  email: string;
  programOrDepartment: string;
  phoneNumber: string;
}

export interface ImportCheckedRow {
  /** 1-based, as the person would count the lines of their file. */
  row: number;
  data: ImportRow;
  errors: Record<string, string>;
  ok: boolean;
}

export interface ImportCheck {
  rows: ImportCheckedRow[];
  creatable: number;
  skipped: number;
}

export interface ImportResult {
  created: { name: string; email: string; type: string; idNumber: string; temporaryPassword: string }[];
  skipped: ImportCheckedRow[];
}

/** One account in the data privacy tools (a student, faculty or staff member). */
export interface PrivacyMember {
  uuid: string;
  name: string;
  email: string;
  idNumber: string;
  memberType: "student" | "faculty" | "staff";
  /** Their program (students) or department. */
  detail: string | null;
  isDisabled: boolean;
  isAnonymized: boolean;
  /** Why this account can't be anonymized yet; empty when it can. */
  blockers: string[];
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
  /** Checks a list without creating anything: which rows would be created and which skipped, and why. */
  checkImport(rows: ImportRow[]) {
    return this.apiRequest<ImportCheck>("/admin/members/import", { method: "POST", body: { rows, dryRun: true } });
  }
  importMembers(rows: ImportRow[]) {
    return this.apiRequest<ImportResult>("/admin/members/import", { method: "POST", body: { rows } });
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

  // ---- data privacy
  searchPrivacy(q: string) {
    return this.apiRequest<{ members: PrivacyMember[] }>("/admin/privacy/search", { query: { q } });
  }
  /** Everything the library holds about one member, as the server sends it. */
  exportMemberData(uuid: string) {
    return this.apiRequest<Record<string, unknown>>(`/admin/privacy/members/${uuid}/export`);
  }
  anonymizeMember(uuid: string) {
    return this.apiRequest<{ message: string }>(`/admin/privacy/members/${uuid}/anonymize`, { method: "POST" });
  }

  // ---- roles and the audit log
  roles() {
    return this.apiRequest<RolesOverview>("/admin/roles");
  }
  saveRole(role: StaffRole, permissions: string[]) {
    return this.apiRequest<RolesOverview>(`/admin/roles/${role}`, { method: "PUT", body: { permissions } });
  }
  auditLogs(query: { search?: string; area?: string; page?: number; perPage?: number } = {}) {
    return this.apiRequest<{ areas: Record<string, string>; logs: Page<AuditEntry> }>("/admin/audit-logs", {
      query: { search: query.search || undefined, area: query.area || undefined, page: query.page, perPage: query.perPage },
    });
  }
}

export const adminService = new AdminServiceClass();
