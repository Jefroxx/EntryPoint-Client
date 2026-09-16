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

export interface BookStatusOverview {
  total: number;
  breakdown: {
    available: number;
    borrowed: number;
    maintenance: number;
    inactive: number;
  };
}

export interface RecentLoan {
  studentName: string;
  bookTitle: string;
  checkoutDate: string;
  dueDate: string;
  status: "Active" | "Due Soon" | "Due" | "Returned";
}

export interface OverdueLoan {
  studentName: string;
  bookTitle: string;
  daysOverdue: number;
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

  fetchBookStatusOverview() {
    const runtimeConfig = useRuntimeConfig();

    return $fetch<BookStatusOverview>("/librarian/dashboard/book-status", {
      baseURL: runtimeConfig.public.apiBaseURL,
      method: "GET",
      headers: {
        Accept: "application/json",
        ...this.authHeaders(),
      },
    });
  }

  fetchRecentLoans() {
    const runtimeConfig = useRuntimeConfig();

    return $fetch<RecentLoan[]>("/librarian/dashboard/recent-loans", {
      baseURL: runtimeConfig.public.apiBaseURL,
      method: "GET",
      headers: {
        Accept: "application/json",
        ...this.authHeaders(),
      },
    });
  }

  fetchOverdueLoans() {
    const runtimeConfig = useRuntimeConfig();

    return $fetch<OverdueLoan[]>("/librarian/dashboard/overdue-loans", {
      baseURL: runtimeConfig.public.apiBaseURL,
      method: "GET",
      headers: {
        Accept: "application/json",
        ...this.authHeaders(),
      },
    });
  }
}

export const librarianService = new LibrarianServiceClass();
