import { BaseService, type RequestOptions } from "./BaseService";

interface PersonRef {
  studentID: number;
  studentIDNumber?: string;
  academicProgram?: string | null;
  user: { firstName: string; lastName: string } | null;
}

export interface LoanRecord {
  loanID: number;
  uuid: string;
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

/** The "Return this book?" window: everything about the loan, plus the late fee returning it right now would charge. */
export interface ReturnPreview {
  /** Set when the window is for a student's self-return report. */
  report?: { reportID: number; reportedAt: string } | null;
  loan: { loanID: number; status: string; checkoutAt: string; dueAt: string; overdue: boolean };
  book: {
    title: string;
    authors: string[];
    isbn: string | null;
    callNumber: string | null;
    areaOfLibrary: string | null;
    accessionNumber: number;
    barcodeValue: string | null;
  };
  student: {
    name: string;
    studentIDNumber: string | null;
    academicProgram: string | null;
    email: string | null;
    phoneNumber: string | null;
    /** Fines from other loans that are still owed. */
    unpaidFinesTotal: number;
  };
  /** hasRule is false when the collection has no fine rule: a late book is then not charged. */
  fine: {
    hasRule: boolean;
    unitsLate: number;
    /** Days after the due time with no charge; the late units are counted after it. */
    graceDays?: number;
    rateUnit: "day" | "hour" | null;
    rate: number | null;
    amount: number;
    /** The fine already written for this loan (by the hourly job), with whether it was paid; null if none yet. */
    onRecord: { amount: number; paymentStatus: "Paid" | "Unpaid"; settledAt: string | null } | null;
  };
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
  uuid: string;
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
  uuid: string;
  reportedAt: string;
  verificationStatus: "Pending" | "Verified" | "Rejected";
  /** Why a rejected report was rejected; the student is told. */
  rejectionReason?: string | null;
  loan: LoanRecord | null;
}

export interface PenaltyRecord {
  penaltyID: number;
  uuid: string;
  amount: string;
  computedAt: string;
  settledAt: string | null;
  paymentStatus: "Unpaid" | "Paid";
  /** The cashier's official receipt number, written down when the fine was marked paid. */
  receiptNumber: string | null;
  loan: LoanRecord | null;
  penalty_type: { category: string } | null;
}

export interface PenaltyStats {
  unpaidCount: number;
  unpaidTotal: number;
  paidCount: number;
  /** Unpaid fines whose book came back more than `longUnpaidDays` days ago. */
  longUnpaidCount: number;
  longUnpaidDays: number;
}

/** `longUnpaid`: unpaid long after the book came back (see PenaltyStats.longUnpaidDays). */
export type PenaltyFilter = "Unpaid" | "Paid" | "longUnpaid";

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
  fetchReceipt(loanUuid: string) {
    return this.request<{ receipt: LoanReceipt }>(`/librarian/loans/${loanUuid}/receipt`);
  }

  /** After checking a received book: back on the shelf if it's fine, marked damaged if it isn't. */
  finishReturn(loanUuid: string, payload: { condition: "good" | "damaged"; note?: string }) {
    return this.request<{ message: string; loan: LoanRecord }>(`/librarian/loans/${loanUuid}/finish-return`, { method: "POST", body: payload });
  }

  /** What returning this loan would involve, shown for confirmation before anything changes. */
  fetchReturnPreview(loanUuid: string) {
    return this.request<{ preview: ReturnPreview }>(`/librarian/loans/${loanUuid}/return-preview`);
  }

  /** `finePaid`: the student paid the late fee at the desk, so the fine is settled with the return (with the cashier's `receiptNumber`). */
  returnLoan(loanUuid: string, payload: { finePaid?: boolean; receiptNumber?: string } = {}) {
    return this.request<{ message: string; loan: LoanRecord; penalty: { amount: string; paymentStatus: "Paid" | "Unpaid" } | null }>(
      `/librarian/loans/${loanUuid}/return`, { method: "POST", body: payload });
  }

  fetchReservations(status?: ReservationStatus) {
    return this.request<{ reservations: ReservationRecord[] }>("/librarian/reservations", {
      query: status ? { status } : undefined,
    });
  }

  acceptReservation(reservationUuid: string) {
    return this.request<{ message: string }>(`/librarian/reservations/${reservationUuid}/accept`, { method: "POST" });
  }

  rejectReservation(reservationUuid: string) {
    return this.request<{ message: string }>(`/librarian/reservations/${reservationUuid}/reject`, { method: "POST" });
  }

  fetchSelfReturnReports() {
    return this.request<{ reports: SelfReturnReportRecord[] }>("/librarian/self-return-reports");
  }

  /** What verifying or rejecting this report involves, shown for confirmation before anything changes. */
  fetchSelfReturnPreview(reportUuid: string) {
    return this.request<{ preview: ReturnPreview }>(`/librarian/self-return-reports/${reportUuid}/preview`);
  }

  /** `finePaid`: the student paid the late fee at the desk, so the fine is settled with the return. */
  verifySelfReturn(reportUuid: string, payload: { finePaid?: boolean; receiptNumber?: string } = {}) {
    return this.request<{ message: string; penalty: { amount: string; paymentStatus: "Paid" | "Unpaid" } | null }>(
      `/librarian/self-return-reports/${reportUuid}/verify`, { method: "POST", body: payload });
  }

  /** The `reason` is shown to the student. */
  rejectSelfReturn(reportUuid: string, payload: { reason: string }) {
    return this.request<{ message: string }>(`/librarian/self-return-reports/${reportUuid}/reject`, { method: "POST", body: payload });
  }

  fetchPenalties(params: { search?: string; status?: PenaltyFilter; page?: number; perPage?: number } = {}) {
    return this.request<Paginated<PenaltyRecord>>("/librarian/penalties", { query: params });
  }

  fetchPenaltyStats() {
    return this.request<PenaltyStats>("/librarian/penalties/stats");
  }

  /** `receiptNumber`: the cashier's official receipt for the payment. */
  settlePenalty(penaltyUuid: string, payload: { receiptNumber: string }) {
    return this.request<{ message: string }>(`/librarian/penalties/${penaltyUuid}/settle`, { method: "POST", body: payload });
  }
}

export const circulationService = new CirculationServiceClass();
