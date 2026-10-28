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
    /** What this copy cost, if recorded (a lost/damaged penalty starts from it). */
    cost?: string | number | null;
    book: { bookID: number; title: string; cost?: string | number | null } | null;
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
  /** `Replaced`: a lost/damaged book that the student replaced instead of paying for. */
  paymentStatus: "Unpaid" | "Paid" | "Replaced";
  /** The cashier's official receipt number, written down when the fine was marked paid. */
  receiptNumber: string | null;
  /** The loan behind it: always for a late fee; none for a book lost or damaged inside the library. */
  loan: LoanRecord | null;
  /** Who owes it and for which copy: set on every penalty, with or without a loan. */
  student: PersonRef | null;
  copy: { copyID: number; accessionNumber: number; book: { bookID: number; title: string } | null } | null;
  penalty_type: { category: string } | null;
}

/** Who a penalty is charged to (read from the penalty itself, or from its loan on older rows). */
export function penaltyStudent(penalty: PenaltyRecord): PersonRef | null {
  return penalty.student ?? penalty.loan?.student ?? null;
}

/** The copy a penalty is for, with its book. */
export function penaltyCopy(penalty: PenaltyRecord): PenaltyRecord["copy"] {
  return penalty.copy ?? penalty.loan?.copy ?? null;
}

export interface PenaltyStats {
  unpaidCount: number;
  unpaidTotal: number;
  paidCount: number;
  /** Lost/damaged books the student replaced instead of paying. */
  replacedCount: number;
  /** Unpaid fines whose book came back more than `longUnpaidDays` days ago. */
  longUnpaidCount: number;
  longUnpaidDays: number;
}

/** `longUnpaid`: unpaid long after the book came back (see PenaltyStats.longUnpaidDays). */
export type PenaltyFilter = "Unpaid" | "Paid" | "Replaced" | "longUnpaid";

/** `copy`: a lost or damaged book (the Lost & Damaged tab); `late`: a late fee (the Penalties tab). */
export type PenaltyKind = "copy" | "late";

/** Issue a penalty for a lost or damaged book: for a `loan`, or for a `studentID` and a `copyID` (no loan needed). */
export interface IssuePenaltyPayload {
  type: "lost" | "damaged";
  amount: number;
  loan?: string;
  studentID?: number;
  copyID?: number;
}

/** A penalty over a lost or damaged copy (the student pays the book's price or replaces it), not a late fee. */
export function isCopyPenalty(penalty: { penalty_type: { category: string } | null }): boolean {
  return penalty.penalty_type?.category === "lost" || penalty.penalty_type?.category === "damaged";
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

  fetchPenalties(params: { search?: string; status?: PenaltyFilter; kind?: PenaltyKind; page?: number; perPage?: number } = {}) {
    return this.request<Paginated<PenaltyRecord>>("/librarian/penalties", { query: params });
  }

  fetchPenaltyStats(kind?: PenaltyKind) {
    return this.request<PenaltyStats>("/librarian/penalties/stats", { query: kind ? { kind } : {} });
  }

  /** `receiptNumber`: the cashier's official receipt for the payment. */
  settlePenalty(penaltyUuid: string, payload: { receiptNumber: string }) {
    return this.request<{ message: string }>(`/librarian/penalties/${penaltyUuid}/settle`, { method: "POST", body: payload });
  }

  /**
   * Charges a student for a lost or damaged book, for a loan or for a student and a copy. The copy is marked lost or
   * damaged too, and a loan that was still out is closed.
   */
  issueCopyPenalty(payload: IssuePenaltyPayload) {
    return this.request<{ message: string; penalty: PenaltyRecord }>("/librarian/penalties", { method: "POST", body: payload });
  }

  /** The book turned up or was repaired: cancels the unpaid penalty and puts the copy back on the shelf. */
  cancelCopyPenalty(penaltyUuid: string) {
    return this.request<{ message: string }>(`/librarian/penalties/${penaltyUuid}/cancel`, { method: "POST" });
  }

  /** The student brought a replacement book instead of paying: closes the penalty and adds the new copy. */
  replacePenalty(penaltyUuid: string) {
    return this.request<{ message: string; replacement: { uuid: string; accessionNumber: number } }>(
      `/librarian/penalties/${penaltyUuid}/replace`, { method: "POST" });
  }
}

export const circulationService = new CirculationServiceClass();
