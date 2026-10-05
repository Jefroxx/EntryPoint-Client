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
  /** Received: handed in and in the librarian's hands, waiting to be checked for damage. */
  status: "Active" | "Received" | "Returned";
  student: PersonRef | null;
  copy: {
    copyID: number;
    accessionNumber: number;
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
  /** Handed in, waiting for the librarian to check the book. */
  received: number;
}

export type ReservationStatus = "Waiting" | "Accepted" | "Rejected" | "Fulfilled";

export interface ReservationRecord {
  reservationID: number;
  status: ReservationStatus;
  reservedAt: string;
  pickupCode?: string;
  /** Why Accept is unavailable right now (no free copy, or not first in line for the free copies); null if it can be accepted. */
  acceptBlock?: string | null;
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

/** What a checkout receipt shows (POST /librarian/loans, GET /librarian/loans/{id}/receipt). */
export interface LoanReceipt {
  /** "L-000123" */
  receiptNumber: string;
  status: string;
  checkoutDate: string;
  dueDate: string | null;
  /** Set once the book is back; the slip then says so. */
  returnDate: string | null;
  student: { name: string; studentIDNumber: string; program: string | null };
  book: {
    title: string;
    authors: string[];
    callNumber: string;
    accessionNumber: number;
    barcodeValue: string | null;
    isbn: string | null;
    edition: string | null;
    volume: string | null;
    publisher: string | null;
    publicationYear: number | null;
    pages: number | null;
    subject: string | null;
    areaOfLibrary: string | null;
  };
  /** The fine rule for this book's area, counted from the due date. Null when the area has none. */
  fine: { rate: number; rateUnit: "day" | "hour" } | null;
  printedBy: string | null;
}

class CirculationServiceClass extends BaseService {
  private request<T>(path: string, options: RequestOptions = {}) {
    return this.apiRequest<T>(path, options);
  }

  fetchLoans(params: { search?: string; status?: "active" | "overdue" | "received" | "returned"; page?: number; perPage?: number } = {}) {
    return this.request<Paginated<LoanRecord>>("/librarian/loans", { query: params });
  }

  fetchLoanStats() {
    return this.request<LoanStats>("/librarian/loans/stats");
  }

  /** Resolves the code on a student's reservation pickup slip (R-000123) to its accepted reservation. */
  lookupReservation(code: string) {
    return this.request<{ reservation: ReservationRecord & { studentID: number; bookID: number } }>(
      `/librarian/reservations/lookup/${encodeURIComponent(code.trim())}`,
    );
  }

  checkoutBook(payload: CheckoutPayload) {
    return this.request<{ message: string; loan: LoanRecord; receipt: LoanReceipt }>("/librarian/loans", { method: "POST", body: payload });
  }

  /** A loan's checkout receipt again, for a reprint. */
  fetchReceipt(loanID: number) {
    return this.request<{ receipt: LoanReceipt }>(`/librarian/loans/${loanID}/receipt`);
  }

  /** After checking a received book: back on the shelf if it's fine, marked damaged if it isn't. */
  finishReturn(loanID: number, payload: { condition: "good" | "damaged"; note?: string }) {
    return this.request<{ message: string; loan: LoanRecord }>(`/librarian/loans/${loanID}/finish-return`, { method: "POST", body: payload });
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
