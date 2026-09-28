import { BaseService } from "./BaseService";

/** GET /librarian/dashboard/today — today's desk traffic and the queues waiting on a librarian. */
export interface DashboardToday {
  inLibrary: number;
  visitsToday: number;
  checkedOut: number;
  returned: number;
  dueToday: number;
  overdue: number;
  attention: {
    registrations: number;
    bookRequests: number;
    reservations: number;
    selfReturns: number;
    redemptions: number;
    unpaidFines: number;
    unpaidTotal: number;
  };
}

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
  /** Every entrance scan that week. */
  visits: number[];
  /** Different students who came that week (each counted once). */
  visitors: number[];
  /** Different students across the whole month. */
  visitorsTotal: number;
}

export type DemographicsScope = "members" | "visitors";

/** Students by academic program; the five largest keep their name, the rest are "Other". */
export interface Demographics {
  total: number;
  slices: { label: string; count: number }[];
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

export interface LibraryStats {
  totalBooks: number;
  availableBooks: number;
  borrowedBooks: number;
  overdueBooks: number;
}

export interface StudentRecord {
  studentID: number;
  studentIDNumber: string;
  academicProgram: string | null;
  registrationStatus: "pending" | "approved" | "rejected";
  knowledgeScore: number;
  visitStreak: number;
  user: { firstName: string; lastName: string; email: string } | null;
}

export interface PaginatedStudents {
  data: StudentRecord[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export interface StudentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface BookSuggestion {
  suggestionID: number;
  uuid: string;
  title: string;
  author: string | null;
  reason: string | null;
  status: "Pending" | "Approved" | "Rejected";
  progressStep: string | null;
  submittedAt: string;
  student: {
    studentID: number;
    academicProgram: string | null;
    user: { firstName: string; lastName: string } | null;
  } | null;
}

export interface BookAuthor {
  authorID: number;
  name: string;
}

export interface BookCopySummary {
  copyID: number;
  accessionNumber: string;
  status: string;
}

export interface CatalogBook {
  bookID: number;
  title: string;
  isbn: string | null;
  callNumber: string;
  coverImageURL: string | null;
  subject: { subjectID: number; name: string } | null;
  authors: BookAuthor[];
  copies: BookCopySummary[];
}

/** GET /librarian/books/{id}: every stored field, for View details and Edit book. */
export interface BookDetail {
  bookID: number;
  title: string;
  isbn: string | null;
  callNumber: string;
  areasOfLibrary: LibraryArea | null;
  publicationYear: number | null;
  volume: string | null;
  edition: string | null;
  pages: number | null;
  publisher: string | null;
  sourceOfFund: string | null;
  cost: string | number | null;
  copyNumber: string | null;
  remarks: string | null;
  coverImageURL: string | null;
  shelfLocation: string | null;
  subject: { subjectID: number; name: string } | null;
  authors: (BookAuthor & { role: string | null })[];
  /** Retired copies are left out. */
  copies: (BookCopySummary & { barcodeValue: string })[];
  loans: { total: number; active: number };
  createdAt: string | null;
}

export type BookAvailabilityFilter = "" | "available" | "unavailable";

export interface PaginatedBooks {
  data: CatalogBook[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export interface AttendanceLog {
  logID: number;
  entryTime: string;
  exitTime: string | null;
  student: {
    studentID: number;
    studentIDNumber: string;
    academicProgram: string | null;
    user: { firstName: string; lastName: string } | null;
  } | null;
}

export interface PaginatedAttendanceLogs {
  data: AttendanceLog[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export interface AttendanceStats {
  currentlyInLibrary: number;
  totalVisitsToday: number;
  averageMinutesToday: number;
}

/** POST /librarian/attendance-logs/scan: one scan either checks a student in or checks them out. */
export interface AttendanceScanResult {
  message: string;
  action: "check_in" | "check_out";
  log: { logID: number; entryTime: string; exitTime: string | null };
  student: { name: string; program: string | null; studentIDNumber: string; visitStreak: number };
  /** Minutes spent inside; only set on a check-out. */
  durationMinutes: number | null;
  /** Visits from an earlier day that were closed automatically because the student never scanned out. */
  autoClosed: { logID: number; exitTime: string }[];
}

export interface NewBookAuthor {
  name: string;
  role?: string | null;
}

/** Mirrors the `areasOfLibrary` enum on the `books` table. */
export type LibraryArea =
  | "circulation"
  | "reserved"
  | "filipiniana"
  | "fiction"
  | "thesis"
  | "journal"
  | "dissertation";

export interface NewBookPayload {
  title: string;
  authors: NewBookAuthor[];
  subjectName: string;
  isbn?: string | null;
  publicationYear?: number | null;
  callNumber?: string | null;
  areasOfLibrary?: LibraryArea | null;
  shelfLocation?: string | null;
  coverImageURL?: string | null;
  quantity: number;
  publisher?: string | null;
  edition?: string | null;
  volume?: string | null;
  pages?: number | null;
  sourceOfFund?: string | null;
  cost?: number | null;
  copyNumber?: string | null;
  remarks?: string | null;
}

class LibrarianServiceClass extends BaseService {
  fetchDashboardToday() {
    const runtimeConfig = useRuntimeConfig();

    return $fetch<DashboardToday>("/librarian/dashboard/today", {
      baseURL: runtimeConfig.public.apiBaseURL,
      method: "GET",
      headers: {
        Accept: "application/json",
        ...this.authHeaders(),
      },
    });
  }

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

  fetchDemographics(scope: DemographicsScope, month?: string) {
    const runtimeConfig = useRuntimeConfig();

    return $fetch<Demographics>("/librarian/dashboard/demographics", {
      baseURL: runtimeConfig.public.apiBaseURL,
      method: "GET",
      query: { scope, ...(month ? { month } : {}) },
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

  fetchLibraryStats() {
    const runtimeConfig = useRuntimeConfig();

    return $fetch<LibraryStats>("/librarian/library/stats", {
      baseURL: runtimeConfig.public.apiBaseURL,
      method: "GET",
      headers: {
        Accept: "application/json",
        ...this.authHeaders(),
      },
    });
  }

  fetchBooks(params: { search?: string; subjectID?: number; availability?: Exclude<BookAvailabilityFilter, "">; page?: number; perPage?: number } = {}) {
    const runtimeConfig = useRuntimeConfig();

    return $fetch<PaginatedBooks>("/books", {
      baseURL: runtimeConfig.public.apiBaseURL,
      method: "GET",
      query: params,
      headers: {
        Accept: "application/json",
        ...this.authHeaders(),
      },
    });
  }

  fetchAttendanceLogs(params: { search?: string; date?: string; active?: boolean; page?: number; perPage?: number } = {}) {
    const runtimeConfig = useRuntimeConfig();

    return $fetch<PaginatedAttendanceLogs>("/librarian/attendance-logs", {
      baseURL: runtimeConfig.public.apiBaseURL,
      method: "GET",
      query: params,
      headers: {
        Accept: "application/json",
        ...this.authHeaders(),
      },
    });
  }

  fetchAttendanceStats() {
    const runtimeConfig = useRuntimeConfig();

    return $fetch<AttendanceStats>("/librarian/attendance-logs/stats", {
      baseURL: runtimeConfig.public.apiBaseURL,
      method: "GET",
      headers: {
        Accept: "application/json",
        ...this.authHeaders(),
      },
    });
  }

  scanAttendance(barcodeValue: string) {
    return this.apiRequest<AttendanceScanResult>("/librarian/attendance-logs/scan", {
      method: "POST",
      body: { barcodeValue },
    });
  }

  createBook(payload: NewBookPayload) {
    const runtimeConfig = useRuntimeConfig();

    return $fetch<{ message: string; book: CatalogBook }>("/librarian/books", {
      baseURL: runtimeConfig.public.apiBaseURL,
      method: "POST",
      body: payload,
      headers: {
        Accept: "application/json",
        ...this.authHeaders(),
      },
    });
  }

  fetchBook(bookID: number) {
    return this.apiRequest<{ book: BookDetail }>(`/librarian/books/${bookID}`);
  }

  /** Same fields as createBook; `quantity` here is the new number of copies (0 retires them all). */
  updateBook(bookID: number, payload: Partial<NewBookPayload> & { quantity?: number }) {
    return this.apiRequest<{ message: string }>(`/librarian/books/${bookID}`, { method: "PATCH", body: payload });
  }

  deleteBook(bookID: number) {
    return this.apiRequest<{ message: string }>(`/librarian/books/${bookID}`, { method: "DELETE" });
  }

  fetchBookSuggestions() {
    const runtimeConfig = useRuntimeConfig();

    return $fetch<{ suggestions: BookSuggestion[] }>("/librarian/book-suggestions", {
      baseURL: runtimeConfig.public.apiBaseURL,
      method: "GET",
      headers: {
        Accept: "application/json",
        ...this.authHeaders(),
      },
    });
  }

  approveBookSuggestion(suggestionID: number) {
    const runtimeConfig = useRuntimeConfig();

    return $fetch<{ message: string; suggestion: BookSuggestion }>(
      `/librarian/book-suggestions/${suggestionID}/approve`,
      {
        baseURL: runtimeConfig.public.apiBaseURL,
        method: "POST",
        headers: {
          Accept: "application/json",
          ...this.authHeaders(),
        },
      },
    );
  }

  rejectBookSuggestion(suggestionID: number) {
    const runtimeConfig = useRuntimeConfig();

    return $fetch<{ message: string; suggestion: BookSuggestion }>(
      `/librarian/book-suggestions/${suggestionID}/reject`,
      {
        baseURL: runtimeConfig.public.apiBaseURL,
        method: "POST",
        headers: {
          Accept: "application/json",
          ...this.authHeaders(),
        },
      },
    );
  }

  fetchStudents(params: { search?: string; program?: string; status?: string; page?: number; perPage?: number } = {}) {
    const runtimeConfig = useRuntimeConfig();

    return $fetch<PaginatedStudents>("/librarian/students", {
      baseURL: runtimeConfig.public.apiBaseURL,
      method: "GET",
      query: params,
      headers: {
        Accept: "application/json",
        ...this.authHeaders(),
      },
    });
  }

  fetchStudentStats() {
    const runtimeConfig = useRuntimeConfig();

    return $fetch<StudentStats>("/librarian/students/stats", {
      baseURL: runtimeConfig.public.apiBaseURL,
      method: "GET",
      headers: {
        Accept: "application/json",
        ...this.authHeaders(),
      },
    });
  }

  approveStudent(studentID: number) {
    const runtimeConfig = useRuntimeConfig();

    return $fetch<{ message: string; student: StudentRecord }>(`/librarian/students/${studentID}/approve`, {
      baseURL: runtimeConfig.public.apiBaseURL,
      method: "POST",
      headers: {
        Accept: "application/json",
        ...this.authHeaders(),
      },
    });
  }

  rejectStudent(studentID: number) {
    const runtimeConfig = useRuntimeConfig();

    return $fetch<{ message: string; student: StudentRecord }>(`/librarian/students/${studentID}/reject`, {
      baseURL: runtimeConfig.public.apiBaseURL,
      method: "POST",
      headers: {
        Accept: "application/json",
        ...this.authHeaders(),
      },
    });
  }
}

export const librarianService = new LibrarianServiceClass();
