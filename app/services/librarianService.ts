import { BaseService } from "./BaseService";

export interface DashboardSummary {
  totalBooks: number;
  totalMembers: number;
  activeLoans: number;
  pendingFines: number;
}

export interface BorrowingOverview {
  labels: string[];
  borrowed: number[];
  returned: number[];
}

class LibrarianServiceClass extends BaseService {
  fetchDashboardSummary() {
    const runtimeConfig = useRuntimeConfig();

    return $fetch<DashboardSummary>("/librarian/dashboard/summary", {
      baseURL: runtimeConfig.public.apiBaseURL,
      method: "GET",
      headers: {
        Accept: "application/json",
        ...this.authHeaders(),
      },
    });
  }

  fetchBorrowingOverview(month?: string) {
    const runtimeConfig = useRuntimeConfig();

    return $fetch<BorrowingOverview>("/librarian/dashboard/borrowing-overview", {
      baseURL: runtimeConfig.public.apiBaseURL,
      method: "GET",
      query: month ? { month } : undefined,
      headers: {
        Accept: "application/json",
        ...this.authHeaders(),
      },
    });
  }
}

export const librarianService = new LibrarianServiceClass();
