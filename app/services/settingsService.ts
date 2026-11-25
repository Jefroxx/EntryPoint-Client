import { BaseService } from "./BaseService";

export type CollectionArea = "circulation" | "reserved" | "filipiniana";

export const COLLECTIONS: { area: CollectionArea; label: string; hint: string }[] = [
  { area: "circulation", label: "Circulation", hint: "Regular collection" },
  { area: "reserved", label: "Reserved", hint: "Course reserves" },
  { area: "filipiniana", label: "Filipiniana", hint: "Filipiniana collection" },
];

export interface FineRule {
  area: CollectionArea;
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
  account: { firstName: string; lastName: string; email: string | null };
}

class SettingsServiceClass extends BaseService {
  fetchSettings() {
    return this.apiRequest<SettingsOverview>("/librarian/settings");
  }

  saveRewards(lowStockAt: number) {
    return this.apiRequest<{ message: string }>("/librarian/settings/rewards", { method: "PUT", body: { lowStockAt } });
  }

  saveBorrowing(holdHours: number, maxBooks: number) {
    return this.apiRequest<{ message: string }>("/librarian/settings/borrowing", { method: "PUT", body: { holdHours, maxBooks } });
  }

  saveFineRule(area: CollectionArea, payload: { rate: number; rateUnit: "day" | "hour"; gracePeriodDays: number }) {
    return this.apiRequest<{ message: string }>(`/librarian/settings/fine-rules/${area}`, { method: "PUT", body: payload });
  }

  deleteFineRule(area: CollectionArea) {
    return this.apiRequest<{ message: string }>(`/librarian/settings/fine-rules/${area}`, { method: "DELETE" });
  }

  updateAccount(payload: { firstName: string; lastName: string; email?: string }) {
    return this.apiRequest<{ message: string; account: SettingsOverview["account"] }>("/librarian/settings/account", { method: "PATCH", body: payload });
  }

  changePassword(payload: { currentPassword: string; newPassword: string; newPassword_confirmation: string }) {
    return this.apiRequest<{ message: string }>("/librarian/settings/password", { method: "PUT", body: payload });
  }
}

export const settingsService = new SettingsServiceClass();
