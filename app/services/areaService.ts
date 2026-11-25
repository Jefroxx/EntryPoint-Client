import { BaseService } from "./BaseService";

/** How an area is lent out: a number of days or hours, or "overnight" (back at the next opening). */
export type LendingUnit = "days" | "hours" | "overnight";

export interface AreaRecord {
  uuid: string;
  /** What books and loans store (a slug made from the name when the area was added). */
  key: string;
  name: string;
  acronym: string;
  loanable: boolean;
  periodValue: number | null;
  periodUnit: LendingUnit | null;
  books_count: number;
  /** Settings and new books lean on this area by name, so it can't be deleted. */
  locked: boolean;
}

export interface AreaPayload {
  name: string;
  acronym: string;
  loanable: boolean;
  periodValue?: number;
  periodUnit?: LendingUnit;
}

/** One row of what is connected to a card: a book (for an area) or a copy (for a source of fund). */
export interface ConnectedItem {
  id: string;
  /** A short label for the row's tile (a copy's accession number); books have none and show an icon. */
  badge?: string | null;
  title: string;
  detail: string;
  meta: string;
}

export interface ConnectedItems {
  total: number;
  last_page: number;
  items: ConnectedItem[];
}

export interface FundSourceRecord {
  uuid: string;
  name: string;
  /** "Donated" can't be renamed or deleted: its copies cost nothing. */
  locked: boolean;
  copies_count: number;
}

class AreaServiceClass extends BaseService {
  fetchAreas() {
    return this.apiRequest<{ areas: AreaRecord[] }>("/librarian/areas");
  }

  createArea(payload: AreaPayload) {
    return this.apiRequest<{ message: string; area: AreaRecord }>("/librarian/areas", { method: "POST", body: payload });
  }

  updateArea(uuid: string, payload: AreaPayload) {
    return this.apiRequest<{ message: string; area: AreaRecord }>(`/librarian/areas/${uuid}`, { method: "PATCH", body: payload });
  }

  deleteArea(uuid: string) {
    return this.apiRequest<{ message: string }>(`/librarian/areas/${uuid}`, { method: "DELETE" });
  }

  fetchAreaBooks(uuid: string, query: { page: number; search?: string }) {
    return this.apiRequest<ConnectedItems>(`/librarian/areas/${uuid}/books`, { query });
  }

  fetchFundCopies(uuid: string, query: { page: number; search?: string }) {
    return this.apiRequest<ConnectedItems>(`/librarian/fund-sources/${uuid}/copies`, { query });
  }

  fetchFundSources() {
    return this.apiRequest<{ sources: FundSourceRecord[] }>("/librarian/fund-sources");
  }

  createFundSource(payload: { name: string }) {
    return this.apiRequest<{ message: string; source: FundSourceRecord }>("/librarian/fund-sources", { method: "POST", body: payload });
  }

  updateFundSource(uuid: string, payload: { name: string }) {
    return this.apiRequest<{ message: string; source: FundSourceRecord }>(`/librarian/fund-sources/${uuid}`, { method: "PATCH", body: payload });
  }

  deleteFundSource(uuid: string) {
    return this.apiRequest<{ message: string }>(`/librarian/fund-sources/${uuid}`, { method: "DELETE" });
  }
}

export const areaService = new AreaServiceClass();

/** "3 days", "6 hours", "Overnight" or "Not lent out", for a row or a card. */
export function lendingText(area: Pick<AreaRecord, "loanable" | "periodValue" | "periodUnit">): string {
  if (!area.loanable) return "Library use only";
  if (area.periodUnit === "overnight") return "Overnight";
  const unit = area.periodUnit === "hours" ? "hour" : "day";
  return `${area.periodValue ?? '—'} ${unit}${area.periodValue === 1 ? "" : "s"}`;
}
