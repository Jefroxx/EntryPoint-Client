import { BaseService } from "./BaseService";

/** One slice of a donut: a program, how many students. */
export interface ProgramSlice { label: string; count: number }

export interface ReportOverview {
  /** The days the report covers (Y-m-d). */
  period: { from: string; to: string };
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
  /** Students by program: all approved students, and those who visited in the period. */
  students: Record<"members" | "visitors", { total: number; slices: ProgramSlice[] }>;
  /** Every physical copy by where it is now. */
  collection: { total: number; breakdown: { available: number; borrowed: number; maintenance: number; inactive: number } };
  /** Computers, rooms and the like: sessions, and the minutes they ran, by type. */
  resources: { sessions: number; minutes: number; byType: { type: string; sessions: number; minutes: number }[] };
  fines: { collected: number; collectedCount: number; waived: number; waivedCount: number; outstanding: number; outstandingCount: number };
  reservations: { total: number; byStatus: { status: string; count: number }[] };
  rewards: { redemptions: number; pointsSpent: number; pending: number; cancelled: number };
}

/** One figure for the chosen period beside the period of the same length before it. `change` is a percentage. */
export interface ReportTrend {
  current: number;
  previous: number;
  change: number | null;
}

class ReportServiceClass extends BaseService {
  /** The last 3, 6 or 12 months, or a range of days (Y-m-d). */
  fetchOverview(period: { months: 3 | 6 | 12 } | { from: string; to: string }) {
    return this.apiRequest<ReportOverview>("/librarian/reports/overview", { query: period });
  }
}

export const reportService = new ReportServiceClass();
