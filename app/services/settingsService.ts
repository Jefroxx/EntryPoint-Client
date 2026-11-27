import { BaseService } from "./BaseService";

/** The key of an area of the library (circulation, reserved, filipiniana, or one the library added). */
export type CollectionArea = string;

export interface FineRule {
  area: CollectionArea;
  areaName: string;
  /** Whether the area can be borrowed at all: a fine only means something where it can. */
  loanable: boolean;
  configured: boolean;
  rate: number | null;
  rateUnit: "day" | "hour";
  gracePeriodDays: number;
}

export interface SettingsOverview {
  /** Hours an accepted reservation holds a copy before it expires (24 = a day). */
  reservationHoldHours: number;
  /** The most books one student can have at a time (loans and reservations together). */
  maxBooks: number;
  /** A reward with this many left, or fewer, counts as running low in the Rewards Market. */
  lowStockAt: number;
  fineRules: FineRule[];
  /** The signed-in staff account: the editable details, and the read-only record (role, username, phone). */
  account: {
    firstName: string;
    lastName: string;
    email: string | null;
    username: string | null;
    phoneNumber: string | null;
    role: "admin" | "librarian" | "assistant";
    roleLabel: string;
  };
}

class SettingsServiceClass extends BaseService {
  /** Only the signed-in account: what the admin side's Account page needs (admins can't open the other settings). */
  fetchAccount() {
    return this.apiRequest<{ account: SettingsOverview["account"] }>("/librarian/settings/account");
  }

  fetchSettings() {
    return this.apiRequest<SettingsOverview>("/librarian/settings");
  }

  saveRewards(lowStockAt: number) {
    return this.apiRequest<{ message: string }>("/librarian/settings/rewards", { method: "PUT", body: { lowStockAt } });
  }

  saveBorrowing(holdHours: number, maxBooks: number) {
    return this.apiRequest<{ message: string; cancelled: number; students: number }>("/librarian/settings/borrowing", { method: "PUT", body: { holdHours, maxBooks } });
  }

  /** What a new limit would cancel, without changing anything. */
  borrowingImpact(maxBooks: number) {
    return this.apiRequest<{ students: number; reservations: number }>("/librarian/settings/borrowing/impact", { query: { maxBooks } });
  }

  saveFineRule(area: CollectionArea, payload: { rate: number; rateUnit: "day" | "hour"; gracePeriodDays: number }) {
    return this.apiRequest<{ message: string }>(`/librarian/settings/fine-rules/${area}`, { method: "PUT", body: payload });
  }

  deleteFineRule(area: CollectionArea) {
    return this.apiRequest<{ message: string }>(`/librarian/settings/fine-rules/${area}`, { method: "DELETE" });
  }

  updateAccount(payload: { firstName: string; lastName: string; email?: string; currentPassword?: string }) {
    return this.apiRequest<{ message: string; account: SettingsOverview["account"] }>("/librarian/settings/account", { method: "PATCH", body: payload });
  }

  changePassword(payload: { currentPassword: string; newPassword: string; newPassword_confirmation: string }) {
    return this.apiRequest<{ message: string }>("/librarian/settings/password", { method: "PUT", body: payload });
  }
}

export const settingsService = new SettingsServiceClass();
