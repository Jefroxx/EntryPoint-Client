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
}

class ReportServiceClass extends BaseService {
  fetchOverview(months: 3 | 6 | 12) {
    return this.apiRequest<ReportOverview>("/librarian/reports/overview", { query: { months } });
  }
}

export const reportService = new ReportServiceClass();
