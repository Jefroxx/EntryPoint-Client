import { BaseService } from "./BaseService";

export interface ReportOverview {
  kpis: {
    loansThisMonth: number;
    onTimeRate: number | null;
    avgVisitMinutes: number | null;
    finesOutstanding: number;
  };
  loansPerMonth: { labels: string[]; checkedOut: number[]; returned: number[] };
  visitsByWeekday: { labels: string[]; counts: number[] };
  topBooks: { title: string; count: number }[];
  booksByCategory: { name: string; count: number }[];
  trends: Record<"loans" | "visits" | "late", ReportTrend>;
  overdue: {
    now: number;
    aging: { label: string; count: number }[];
    byMonth: { labels: string[]; counts: number[] };
    oldest: { student: string; memberID: string | null; title: string; dueDate: string; daysOverdue: number }[];
  };
  utilization: {
    /** Percent of lendable copies that are out right now; null when there are no lendable copies. */
    rate: number | null;
    copiesOut: number;
    lendableCopies: number;
    neverBorrowedTitles: number;
    bySubject: { name: string; loans: number; copies: number; perCopy: number }[];
  };
}

/** One figure for the chosen period beside the period of the same length before it. `change` is a percentage. */
export interface ReportTrend {
  current: number;
  previous: number;
  change: number | null;
}

class ReportServiceClass extends BaseService {
  fetchOverview(months: 3 | 6 | 12) {
    return this.apiRequest<ReportOverview>("/librarian/reports/overview", { query: { months } });
  }
}

export const reportService = new ReportServiceClass();
