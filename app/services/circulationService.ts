import { BaseService, type RequestOptions } from "./BaseService";

interface PersonRef {
  studentID: number;
  studentIDNumber?: string;
  academicProgram?: string | null;
  user: { firstName: string; lastName: string } | null;
}

export interface LoanRecord {
  loanID: number;
  checkoutDate: string;
  dueDate: string;
  returnDate: string | null;
  status: "Active" | "Returned";
  student: PersonRef | null;
  copy: {
    copyID: number;
    accessionNumber: string;
    book: { bookID: number; title: string } | null;
  } | null;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export interface LoanStats {
  active: number;
  dueSoon: number;
  overdue: number;
}

export type ReservationStatus = "Waiting" | "Accepted" | "Rejected" | "Fulfilled";

export interface ReservationRecord {
  reservationID: number;
  status: ReservationStatus;
  reservedAt: string;
  student: PersonRef | null;
  book: { bookID: number; title: string } | null;
}

export interface SelfReturnReportRecord {
  reportID: number;
  reportedAt: string;
  verificationStatus: "Pending" | "Verified" | "Rejected";
  loan: LoanRecord | null;
}

export interface PenaltyRecord {
  penaltyID: number;
  amount: string;
  computedAt: string;
  settledAt: string | null;
  paymentStatus: "Unpaid" | "Paid";
  loan: LoanRecord | null;
  penalty_type: { category: string } | null;
}

export interface PenaltyStats {
  unpaidCount: number;
  unpaidTotal: number;
  paidCount: number;
}

export interface CheckoutPayload {
  studentID: number;
  copyID: number;
  reservationID?: number;
}

class CirculationServiceClass extends BaseService {
  private request<T>(path: string, options: RequestOptions = {}) {
    return this.apiRequest<T>(path, options);
  }

  fetchLoans(params: { search?: string; status?: "active" | "overdue" | "returned"; page?: number; perPage?: number } = {}) {
    return this.request<Paginated<LoanRecord>>("/librarian/loans", { query: params });
  }

  fetchLoanStats() {
    return this.request<LoanStats>("/librarian/loans/stats");
  }

  checkoutBook(payload: CheckoutPayload) {
    return this.request<{ message: string; loan: LoanRecord }>("/librarian/loans", { method: "POST", body: payload });
  }

  returnLoan(loanID: number) {
    return this.request<{ message: string; loan: LoanRecord }>(`/librarian/loans/${loanID}/return`, { method: "POST" });
  }

  fetchReservations(status?: ReservationStatus) {
    return this.request<{ reservations: ReservationRecord[] }>("/librarian/reservations", {
      query: status ? { status } : undefined,
    });
  }

  acceptReservation(reservationID: number) {
    return this.request<{ message: string }>(`/librarian/reservations/${reservationID}/accept`, { method: "POST" });
  }

  rejectReservation(reservationID: number) {
    return this.request<{ message: string }>(`/librarian/reservations/${reservationID}/reject`, { method: "POST" });
  }

  fetchSelfReturnReports() {
    return this.request<{ reports: SelfReturnReportRecord[] }>("/librarian/self-return-reports");
  }

  verifySelfReturn(reportID: number) {
    return this.request<{ message: string }>(`/librarian/self-return-reports/${reportID}/verify`, { method: "POST" });
  }

  rejectSelfReturn(reportID: number) {
    return this.request<{ message: string }>(`/librarian/self-return-reports/${reportID}/reject`, { method: "POST" });
  }

  fetchPenalties(params: { search?: string; status?: "Unpaid" | "Paid"; page?: number; perPage?: number } = {}) {
    return this.request<Paginated<PenaltyRecord>>("/librarian/penalties", { query: params });
  }

  fetchPenaltyStats() {
    return this.request<PenaltyStats>("/librarian/penalties/stats");
  }

  settlePenalty(penaltyID: number) {
    return this.request<{ message: string }>(`/librarian/penalties/${penaltyID}/settle`, { method: "POST" });
  }
}

export const circulationService = new CirculationServiceClass();
