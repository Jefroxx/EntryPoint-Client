import { BaseService } from "./BaseService";
import type { HallOfFame } from "./studentService";
import type { BookPagePhoto, BookPageSection } from "~/utils/bookPages";
import type { StaffRef } from "~/utils/staffRole";
import type { Announcement } from "./announcementService";

/** GET /librarian/dashboard: everything the Dashboard shows, in one request. */
export interface DashboardOverview {
  today: DashboardToday;
  recentLoans: RecentLoan[];
  overdueLoans: OverdueLoan[];
  hallOfFame: HallOfFame;
  announcements: Announcement[];
}

/** One row of an accession record as read from the Excel file (all text, as typed). Only `title` is needed. */
export interface ImportBookRow {
  /** The row number in the sheet, so a skipped row can be found in the file. */
  row: number;
  accessionNumber?: string;
  dateReceived?: string;
  /** Excel counted this date up when a cell was dragged down; it isn't a real date. */
  dateAutofilled?: boolean;
  /** The Class column: area + Dewey number + Cutter ("Fil 515.3 AS843 2023"). */
  callNumber?: string;
  area?: string;
  authors?: string;
  title?: string;
  edition?: string;
  volume?: string;
  pages?: string;
  sourceOfFund?: string;
  cost?: string;
  publisher?: string;
  year?: string;
  remarks?: string;
  isbn?: string;
}

/** What an import added (or, checked first with dryRun, would add) and what it left out and why. */
export interface ImportBooksResult {
  books: number;
  existingBooks: number;
  copies: number;
  emptyRows: number;
  skipped: { row: number | null; accessionNumber: number | null; title: string; reason: string }[];
  notes: { incomplete: number; noArea: number; unreadDate: number; unreadCallNumber: number; newNumbers: number };
}

/** What Check Details may fill in: only fields the book's record has empty. */
export interface DetailsFills {
  isbn?: string;
  publisher?: string;
  publicationYear?: number;
  pageCount?: number;
  edition?: string;
  volume?: string;
  coverImageURL?: string;
  authors?: string[];
  deweyNumber?: string;
  deweySource?: string;
}

/** One book's check: what the catalogues found and what of it would fill the record's blanks. Saves nothing. */
export interface DetailsCheckResult {
  bookUuid: string;
  found: boolean;
  reason?: string;
  /** "isbn": looked up by the book's own ISBN. "title": found by title and author (worth a second look). */
  matchedBy?: "isbn" | "title" | "scan";
  matched?: { isbn: string; title: string | null; authors: string[]; publisher: string | null; year: number | null };
  /** For a title match: does the edition's year agree with the record's? null when either has none. */
  yearAgrees?: boolean | null;
  /** Does the catalogue's title agree with the record's? false for a mistyped ISBN that is another book's. */
  titleAgrees?: boolean | null;
  /** The ISBN found is already another book's, so it can't be given to this one. */
  isbnTakenBy?: string | null;
  /** A scan of a book that already has a different ISBN on record: the record's, which is kept. */
  recordIsbn?: string | null;
  /** For a scan: false when no catalogue knows the scanned ISBN (only the ISBN itself can be saved). */
  catalogueFound?: boolean;
  fills?: DetailsFills;
}

export interface DetailsQueueBook {
  uuid: string;
  title: string;
  authors: string[];
  isbn: string | null;
  publicationYear: number | null;
  areaOfLibrary: string | null;
  callNumber: string | null;
  deweyStatus: DeweyStatus;
}

/** GET /librarian/dashboard/trends: the Trends section (totals, collection, the month's chart and programs). */
export interface DashboardTrends {
  summary: DashboardSummary;
  bookStatus: BookStatusOverview;
  borrowingOverview: BorrowingOverview;
  demographics: { members: Demographics; visitors: Demographics };
}

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

/** What the dashboard's "click a row" drawer shows beyond the row itself. Sent with every dashboard loan. */
export interface LoanRowDetails {
  loanID?: number;
  memberIDNumber?: string | null;
  academicProgram?: string | null;
  accessionNumber?: number | string | null;
  checkoutAt?: string;
  dueAt?: string;
  returnedAt?: string | null;
}

export interface RecentLoan extends LoanRowDetails {
  studentName: string;
  bookTitle: string;
  checkoutDate: string;
  dueDate: string;
  status: "Active" | "Due Soon" | "Due" | "Received" | "Returned";
}

export interface OverdueLoan extends LoanRowDetails {
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
  uuid: string;
  memberIDNumber: string;
  academicProgram: string | null;
  /** Faculty and staff members have a department instead of a program (and an employee ID in memberIDNumber). */
  memberType?: "student" | "faculty" | "staff";
  department?: string | null;
  registrationStatus: "pending" | "approved" | "rejected";
  knowledgeScore: number;
  visitStreak: number;
  created_at?: string;
  reviewedAt?: string | null;
  /** Why a librarian rejected the registration (the student is sent it). */
  rejectionReason?: string | null;
  user: {
    firstName: string;
    middleInitial?: string | null;
    lastName: string;
    email: string;
    emailVerifiedAt?: string | null;
    phoneNumber?: string | null;
    birthDate?: string | null;
    address?: string | null;
  } | null;
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
  /** Every program a student is in, for the program filter. */
  programs: string[];
  /** Only for the faculty and staff list (memberType "members"). */
  faculty?: number;
  staff?: number;
}

export interface BookSuggestion {
  suggestionID: number;
  uuid: string;
  title: string;
  author: string | null;
  reason: string | null;
  status: "Pending" | "Approved" | "Arrived" | "Rejected";
  progressStep: string | null;
  /** Why it was turned down, as the librarian wrote it. */
  rejectionReason?: string | null;
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
  uuid: string;
  accessionNumber: number;
  status: string;
  /** What this copy cost, if recorded. Only a book's full details carry it (the shared catalog list does not). */
  cost?: string | number | null;
}

export interface CatalogBook {
  bookID: number;
  uuid: string;
  title: string;
  isbn: string | null;
  callNumber: string;
  /** "needs_review" until a catalogue or a librarian has confirmed the Dewey number. */
  deweyStatus?: DeweyStatus;
  /** What Add Book asks for that this record lacks ("ISBN", "Publisher"...); books from the old accession record. */
  missingDetails?: string[];
  coverImageURL: string | null;
  /** Where in the library the book is shelved (the key of one of the Areas of the Library). */
  areaOfLibrary?: string | null;
  subject: { subjectID: number; name: string } | null;
  authors: BookAuthor[];
  copies: BookCopySummary[];
  /** Copies on the shelf that are promised to an accepted reservation. */
  heldCopies?: number;
}

/** GET /librarian/books/{id}: every stored field, for View details and Edit book. */
export interface BookDetail {
  bookID: number;
  uuid: string;
  title: string;
  isbn: string | null;
  callNumber: string;
  areaOfLibrary: LibraryArea | null;
  publicationYear: number | null;
  volume: string | null;
  edition: string | null;
  /** How many pages the book has (the page photos are `pages`, below). */
  pageCount: number | null;
  publisher: string | null;
  sourceOfFund: string | null;
  cost: string | number | null;
  remarks: string | null;
  coverImageURL: string | null;
  shelfLocation: string | null;
  deweyNumber?: string | null;
  /** Ticked for a book the library marked as new. */
  isNewArrival?: boolean;
  deweySource?: DeweySource | null;
  deweyStatus?: DeweyStatus;
  spineLabel?: SpineLabelData;
  subject: { subjectID: number; name: string } | null;
  authors: (BookAuthor & { role: string | null })[];
  /** Retired copies are left out. */
  copies: (BookCopySummary & { barcodeValue: string })[];
  /** Copies on the shelf that are promised to an accepted reservation. */
  heldCopies?: number;
  loans: { total: number; active: number };
  createdAt: string | null;
  /** Page photos (table of contents, index…), in book order. */
  pages: BookPagePhoto[];
}

export type BookAvailabilityFilter = "" | "available" | "unavailable";
/** Whether a book's Dewey number has been confirmed by a librarian ("verified") or is still a guess ("unverified"). */
export type BookDeweyFilter = "" | "verified" | "unverified";

export interface PaginatedBooks {
  data: CatalogBook[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export type CopyStatus = "available" | "borrowed" | "lost" | "damaged";

/** GET /librarian/copies: one Book Catalog row, a single copy with its book's fuller record. */
/** One barcode label: the code that gets scanned and enough of the book to tell it apart on the shelf. */
export interface CopyLabel {
  uuid: string;
  accessionNumber: number;
  barcodeValue: string | null;
  title: string;
  authors: string[];
  /** The confirmed call number (Dewey + Cutter, joined), or null while the Dewey number is only a guess (a guess never goes on a label). */
  callNumber: string | null;
  /** The label's call number line: the Dewey number, or null while it is unchecked. */
  dewey: string | null;
  /** The label's author Cutter line, or null while the Dewey number is unchecked. */
  cutter: string | null;
  /** The book's Dewey number is only a guess (so it is left off unless the librarian chose to print it). */
  unconfirmed: boolean;
  area: string;
  year: number | null;
}

/** POST /librarian/copies/labels */
export interface CopyLabelsResponse {
  labels: CopyLabel[];
  total: number;
  /** There were more than the limit (500): only the first ones are included. */
  truncated: boolean;
}

/** GET /librarian/books/{uuid}/removal-summary */
export interface BookRemovalSummary {
  book: { uuid: string; title: string; isbn: string | null; callNumber: string; areaOfLibrary: string | null; subject: string | null; authors: string[]; coverImageURL: string | null };
  copies: {
    items: { accessionNumber: number; barcodeValue: string | null; status: string; cost: string | number | null; sourceOfFund: string | null }[];
    alreadyRemoved: number;
  };
  loans: { total: number; returned: number; active: { name: string; studentID: string | null; accessionNumber: number | null; dueDate: string | null }[] };
  penalties: { total: number; unpaidCount: number; unpaidAmount: number };
  reservations: { total: number; open: { name: string; studentID: string | null; status: string; pickupCode: string }[] };
  wishlists: number;
  pagePhotos: number;
  stockLogCount: number;
  /** What stops the removal (a copy still out on loan). Empty means it can go ahead. */
  blockers: string[];
}

/** A copy found by scanning its barcode at the checkout desk. */
export interface ScannedCopy {
  copyID: number;
  uuid?: string;
  accessionNumber: number;
  barcodeValue: string | null;
  status: string;
  /** null = can be lent; otherwise why it can't ("This copy is already out on loan."). */
  lendable: string | null;
  /** The only reason it can't go out is a hold for an accepted reservation (that reservation's checkout may lend it). */
  heldForReservation?: boolean;
  /** When it would fall due if lent today (null for a book that can't be lent). */
  dueDate?: string | null;
  book: {
    bookID: number; uuid?: string; title: string; coverImageURL: string | null; authors: string[];
    callNumber?: string | null; isbn?: string | null; publisher?: string | null; publicationYear?: number | null;
    edition?: string | null; volume?: string | null; areaOfLibrary?: string | null; shelfLocation?: string | null;
  };
}

export interface CopyCatalogRow {
  copyID: number;
  uuid: string;
  accessionNumber: number;
  barcodeValue: string | null;
  status: CopyStatus;
  /** This copy's own record of where it came from; null for copies that were added before it was kept. */
  sourceOfFund?: string | null;
  cost?: string | number | null;
  remarks?: string | null;
  /** The day it reached the library (Y-m-d), from the accession record; null when not known. */
  dateReceived?: string | null;
  book: {
    bookID: number;
    uuid: string;
    title: string;
    isbn: string | null;
    callNumber: string;
    areaOfLibrary: LibraryArea | null;
    publicationYear: number | null;
    volume: string | null;
    edition: string | null;
    pageCount: number | null;
    publisher: string | null;
    sourceOfFund: string | null;
    cost: string | number | null;
    /** The book's own remarks; a copy's remarks (if any) take priority in the export. */
    remarks?: string | null;
    deweyStatus?: DeweyStatus;
    shelfLocation: string | null;
    coverImageURL: string | null;
    subject: { subjectID: number; name: string } | null;
    authors: string[];
  };
}

/** GET /librarian/stock-logs: one copy added to or removed from the catalog. */
export interface StockLogRow {
  logID: number;
  bookID: number | null;
  bookTitle: string;
  copyID: number | null;
  accessionNumber: string | null;
  action: "added" | "removed" | "edited";
  reason: string | null;
  note: string | null;
  librarianName: string | null;
  created_at: string;
}

export interface PaginatedStockLogs {
  data: StockLogRow[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

/** Why a copy leaves the catalog (the server accepts exactly these). */
export const REMOVE_REASONS = ["Lost", "Damaged", "Withdrawn", "Donated", "Other"] as const;
export type RemoveReason = (typeof REMOVE_REASONS)[number];

export interface PaginatedCopies {
  data: CopyCatalogRow[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export interface AttendanceLog {
  logID: number;
  uuid: string;
  /** Set for a walk-in with no account (then `student` is null). */
  visitorName: string | null;
  visitorPurpose: string | null;
  entryTime: string;
  exitTime: string | null;
  /** The staff account that scanned the visit in; null for visits logged before this was kept. */
  checkedInByStaff?: StaffRef | null;
  /** The staff account that scanned it out; null while it is open, or when the system closed it (end of day, nightly clean-up). */
  checkedOutByStaff?: StaffRef | null;
  student: {
    studentID: number;
    memberIDNumber: string;
    academicProgram: string | null;
    /** Faculty and staff have a department instead of a program. */
    department?: string | null;
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
  /** Who is inside the library right now (students and walk-in visitors). */
  inside: { students: number; visitors: number; /** Part of those: visits left open from an earlier day. */ earlier: { students: number; visitors: number } };
  /** The date the `day` numbers are for (Y-m-d). */
  date: string;
  /** One day's attendance: visits that started that day, different students and walk-in visitors, and the average stay. */
  day: { visits: number; students: number; visitors: number; /** null while nobody has left yet that day. */ averageMinutes: number | null };
}

/** POST /librarian/attendance-logs/scan: one scan either checks a student in or checks them out. */
export interface AttendanceScanResult {
  message: string;
  action: "check_in" | "check_out";
  log: { logID: number; entryTime: string; exitTime: string | null; checkedInByStaff?: StaffRef | null; checkedOutByStaff?: StaffRef | null };
  student: { name: string; program: string | null; memberIDNumber: string; visitStreak: number };
  /** Minutes spent inside; only set on a check-out. */
  durationMinutes: number | null;
  /** Visits from an earlier day that were closed automatically because the student never scanned out. */
  autoClosed: { logID: number; exitTime: string }[];
  /** A computer or room session that ended because the student logged out of the library; null when they had none. */
  endedSession?: { name: string; minutes: number } | null;
}

/**
 * POST /librarian/scan: one endpoint for every barcode. The code says what it is, and `type` says what happened:
 * a student ID (attendance), a borrowing receipt (book handed in), a reservation slip, or a facility's label.
 */
export type ScanResult =
  | (AttendanceScanResult & { type: "attendance" })
  | {
      /** A borrowing receipt (L-…) or a book's own label (BK-…): the loan to return. Nothing has changed yet. */
      type: "loan_return";
      message: string;
      loan: {
        loanID: number;
        uuid: string;
        /** Active: the usual Return window. Received: already handed in, so the check that finishes it. */
        status: "Active" | "Received";
        receiptNumber: string;
        bookTitle: string;
        accessionNumber: number;
        studentName: string;
        memberIDNumber: string;
        dueDate: string | null;
        isOverdue: boolean;
      };
    }
  | {
      type: "reservation";
      message: string;
      reservation: {
        reservationID: number;
        uuid: string;
        pickupCode: string;
        studentID: number;
        bookID: number;
        studentName: string;
        memberIDNumber: string;
        bookTitle: string;
      };
    }
  | { type: "facility"; message: string; resource: ScanFacility }
  | { type: "facility_started"; message: string; resource: ScanFacility; student: { name: string; program: string | null; memberIDNumber: string } }
  | { type: "facility_ended"; message: string; resource: ScanFacility; student: string; minutes: number };

export interface ScanFacility {
  resID: number;
  name: string;
  resourceType: string;
}

export interface NewBookAuthor {
  name: string;
  role?: string | null;
}

/** An area's key (what books store). The areas are the librarian's own list: Library > Categories > Areas of the Library. */
export type LibraryArea = string;

/** Area key -> display name, kept up to date from that list (see utils/libraryAreas.ts). */
export { LIBRARY_AREAS } from "~/utils/libraryAreas";

/** Where a book's Dewey number came from. "guessed" is the keyword guess and always needs a librarian's check. */
export type DeweySource = "library_of_congress" | "open_library" | "manual" | "guessed";
export type DeweyStatus = "ok" | "needs_review";

export const DEWEY_SOURCE_LABEL: Record<DeweySource, string> = {
  library_of_congress: "Library of Congress",
  open_library: "Open Library",
  manual: "Typed in",
  guessed: "Guessed from the category",
};

/** The three catalogues an ISBN is looked up in. */
export type IsbnSourceName = "library_of_congress" | "open_library" | "google_books";

/**
 * How one catalogue went: 'found' (has the book), 'none' (answered, has no record), 'unreachable' (did not answer: a
 * timeout or an outage), 'off' (switched off on the server).
 */
export type IsbnSourceOutcome = "found" | "none" | "unreachable" | "off";

/** POST /librarian/isbn/lookup/source */
export interface IsbnSourceCheck {
  source: IsbnSourceName;
  status: IsbnSourceOutcome;
  /** How long the catalogue took (0 when the answer was already remembered). */
  ms: number;
  cached: boolean;
  title: string | null;
}

/** POST /librarian/isbn/lookup: a book's details from its ISBN, or why there are none. */
export type IsbnDetailsLookup =
  | {
      found: true;
      isbn: string;
      title: string | null;
      authors: string[];
      publisher: string | null;
      publishYear: number | null;
      pageCount: number | null;
      /** As the catalogue states it ("3rd ed."); null when none does (the librarian types it, or N/A). */
      edition: string | null;
      /** "Vol. 2" when a catalogue says which volume; null when it can't tell (a whole set, or no statement). */
      volume: string | null;
      /** Things to check by eye, e.g. "listed as a set of 7 volumes, so the volume can't be read". */
      hints: string[];
      description: string | null;
      coverUrl: string | null;
      deweyNumber: string | null;
      deweySource: DeweySource | null;
      /** Which catalogues the fields came from, most trusted first. */
      sources: string[];
      sourceStatus: Partial<Record<IsbnSourceName, IsbnSourceOutcome>>;
      /** 'unreachable' means the Dewey catalogue didn't answer, so an empty number may only mean "couldn't ask". */
      deweyStatus: "found" | "none" | "unreachable";
    }
  | {
      found: false;
      reason: "invalid" | "not_found";
      isbn?: string;
      message: string;
      sourceStatus?: Partial<Record<IsbnSourceName, IsbnSourceOutcome>>;
    };

/** POST /librarian/dewey/lookup */
export interface DeweyIsbnLookup {
  found: boolean;
  /** Not found AND a catalogue did not answer: "no number" may only mean "couldn't ask". */
  unreachable?: boolean;
  deweyNumber?: string;
  source?: DeweySource;
  cutter?: string | null;
  year?: number | null;
}

/** POST /librarian/books/{uuid}/dewey/lookup and PUT .../dewey */
export interface DeweyApplied {
  found?: boolean;
  message: string;
  deweyNumber?: string;
  callNumber?: string;
  deweySource?: DeweySource;
}

export interface DeweyReviewBook {
  bookID: number;
  uuid: string;
  title: string;
  isbn: string | null;
  authors: string[];
  subject: string | null;
  callNumber: string;
  deweyNumber: string | null;
  deweySource: DeweySource | null;
}

export interface DeweyReviewResponse {
  books: { data: DeweyReviewBook[]; current_page: number; last_page: number; total: number; per_page: number };
  /** Every book still waiting for a check, whatever the search. */
  needsReview: number;
}

/** The four lines of the spine label, top to bottom. While `pending`, the Dewey and Cutter lines are empty. */
export interface SpineLabelData {
  area: string;
  dewey: string | null;
  cutter: string | null;
  year: number | null;
  pending: boolean;
}

export interface NewBookPayload {
  title: string;
  authors: NewBookAuthor[];
  isbn?: string | null;
  publicationYear?: number | null;
  callNumber?: string | null;
  areaOfLibrary?: LibraryArea | null;
  shelfLocation?: string | null;
  coverImageURL?: string | null;
  quantity: number;
  publisher?: string | null;
  edition?: string | null;
  volume?: string | null;
  pageCount?: number | null;
  sourceOfFund?: string | null;
  cost?: number | null;
  remarks?: string | null;
  /** Ticked for a book that just arrived: marks it new and notifies everyone. */
  isNewArrival?: boolean;
  /** The Dewey number alone ("005.1"). Left out, the server looks it up by ISBN. */
  deweyNumber?: string | null;
}

class LibrarianServiceClass extends BaseService {
  fetchDashboard() {
    return this.apiRequest<DashboardOverview>("/librarian/dashboard");
  }

  /** Check Details: how many books are still to check, and a page of them. */
  fetchDetailsQueue(params: { area?: string; perPage?: number; page?: number } = {}) {
    return this.apiRequest<{ remaining: number; books: { data: DetailsQueueBook[]; last_page: number; total: number } }>("/librarian/books/details-check", { query: params });
  }

  /** What the catalogues know that one book's record lacks. Saves nothing. With an ISBN scanned from the book, that one is looked up. */
  checkBookDetails(bookUuid: string, scannedIsbn?: string) {
    return this.apiRequest<DetailsCheckResult>(`/librarian/books/${bookUuid}/details/check`, { method: "POST", body: scannedIsbn ? { isbn: scannedIsbn } : undefined });
  }

  /** Saves what was accepted (empty fields only) and marks every book in `checked` as checked. */
  applyBookDetails(items: { book: string; fills: DetailsFills }[], checked: string[]) {
    return this.apiRequest<{ message: string; updated: number; checked: number; refusedIsbns: string[] }>("/librarian/books/details/apply", { method: "POST", body: { items, checked } });
  }

  /** Brings books in from an accession record. With dryRun nothing is saved: the answer says what would happen. */
  importBooks(rows: ImportBookRow[], dryRun: boolean, fileName: string) {
    return this.apiRequest<ImportBooksResult>("/librarian/books/import", { method: "POST", body: { rows, dryRun, fileName } });
  }

  /** The Dashboard's Trends section in one request; `month` (Y-m) picks the chart's and the visitors' month. */
  fetchDashboardTrends(month?: string) {
    return this.apiRequest<DashboardTrends>("/librarian/dashboard/trends", { query: month ? { month } : undefined });
  }

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

  fetchBooks(params: { search?: string; subjectID?: number; area?: string; availability?: Exclude<BookAvailabilityFilter, "">; dewey?: Exclude<BookDeweyFilter, "">; page?: number; perPage?: number } = {}) {
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

  /** The Dashboard's Hall of Fame: the same boards students see, with full names and ID numbers. */
  fetchHallOfFame() {
    return this.apiRequest<HallOfFame>("/librarian/dashboard/hall-of-fame");
  }

  /**
   * What the barcode labels need for the copies chosen: by uuid, every copy of one book, or everything the Book
   * Catalog's search and filters match (up to 500; `truncated` says when there were more).
   */
  fetchCopyLabels(selection: {
    copies?: string[]; book?: string; search?: string; subjectID?: number; status?: CopyStatus; area?: LibraryArea;
    /** Narrow it to these accession numbers: each a range, a single number being from = to. */
    accessions?: { from: number; to: number }[];
    /** Also print the call number and Cutter of books whose Dewey number is only a guess (left off by default). */
  }) {
    return this.apiRequest<CopyLabelsResponse>("/librarian/copies/labels", { method: "POST", body: selection });
  }

  /**
   * The checkout desk's first step: a scanned barcode (or a typed accession number) finds its copy.
   * `lendable` is null when the copy can go out, otherwise the reason it can't.
   */
  lookupCopy(code: string) {
    return this.apiRequest<{ copy: ScannedCopy }>("/librarian/copies/lookup", { query: { code } });
  }

  /** The Book Catalog tab: every copy on its own row, in accession order. */
  fetchCopies(params: { search?: string; subjectID?: number; status?: CopyStatus; area?: LibraryArea; page?: number; perPage?: number } = {}) {
    return this.apiRequest<PaginatedCopies>("/librarian/copies", { query: params });
  }

  /**
   * One copy's status and/or its own record (source of fund, cost, remarks). A borrowed copy's status changes
   * only through check-in, but its record can still be corrected; "retired" removes the copy.
   */
  updateCopy(copyUuid: string, payload: {
    status?: Exclude<CopyStatus, "borrowed"> | "retired";
    sourceOfFund?: string;
    cost?: number;
    remarks?: string | null;
  }) {
    return this.apiRequest<{ message: string; copy: { copyID: number; accessionNumber: number; status: string } }>(
      `/librarian/copies/${copyUuid}`, { method: "PATCH", body: payload });
  }

  /**
   * More copies of a book that is already in the catalog; each is logged in the stock log. Where they came
   * from is required (source of fund, and the cost of each copy); remarks are optional.
   */
  addCopies(bookUuid: string, payload: { quantity: number; sourceOfFund: string; cost: number; remarks?: string }) {
    return this.apiRequest<{ message: string; copies: { copyID: number; accessionNumber: number; status: string }[] }>(
      `/librarian/books/${bookUuid}/copies`, { method: "POST", body: payload });
  }

  /** Takes one copy out of the catalog, recording why. */
  removeCopy(copyUuid: string, payload: { reason: RemoveReason; note?: string }) {
    return this.apiRequest<{ message: string; copy: { copyID: number; accessionNumber: number; status: string } }>(
      `/librarian/copies/${copyUuid}/remove`, { method: "POST", body: payload });
  }

  /** The stock log: every copy added or removed, newest first. */
  fetchStockLogs(params: { search?: string; action?: "added" | "removed" | "edited"; bookID?: number; page?: number; perPage?: number } = {}) {
    return this.apiRequest<PaginatedStockLogs>("/librarian/stock-logs", { query: params });
  }

  fetchAttendanceLogs(params: { search?: string; date?: string; active?: boolean; status?: "in" | "out"; who?: "students" | "members" | "visitors"; sort?: "oldest"; page?: number; perPage?: number } = {}) {
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

  /** Ending the scan station: logs everyone still in the library out, and ends their computer and room sessions. */
  closeAllVisits() {
    return this.apiRequest<{ message: string; students: number; visitors: number; sessionsEnded: number }>(
      "/librarian/attendance-logs/close-all", { method: "POST" });
  }

  /** The live numbers, plus `day` for one date (Y-m-d; today when left out). */
  fetchAttendanceStats(date?: string) {
    const runtimeConfig = useRuntimeConfig();

    return $fetch<AttendanceStats>("/librarian/attendance-logs/stats", {
      baseURL: runtimeConfig.public.apiBaseURL,
      method: "GET",
      query: date ? { date } : undefined,
      headers: {
        Accept: "application/json",
        ...this.authHeaders(),
      },
    });
  }

  /** The universal scanner. `resID` is a facility scanned just before, waiting for the student's ID. */
  scan(code: string, resID?: number) {
    return this.apiRequest<ScanResult>("/librarian/scan", { method: "POST", body: { code, resID } });
  }

  scanAttendance(barcodeValue: string) {
    return this.apiRequest<AttendanceScanResult>("/librarian/attendance-logs/scan", {
      method: "POST",
      body: { barcodeValue },
    });
  }

  /** What the catalogues say about an ISBN (Library of Congress, then Open Library). Saves nothing. */
  lookupIsbnDewey(isbn: string) {
    return this.apiRequest<DeweyIsbnLookup>("/librarian/dewey/lookup", { method: "POST", body: { isbn } });
  }

  /** The book already catalogued under this ISBN, if any (any usual form of the number). Quick; saves nothing. */
  findBookByIsbn(isbn: string) {
    return this.apiRequest<{
      exists: boolean;
      book: { bookUuid: string; title: string; authors: string[]; coverImageURL: string | null; callNumber: string | null; copies: number } | null;
    }>("/librarian/isbn/existing", { method: "POST", body: { isbn } });
  }

  /** What the catalogues know about an ISBN, to fill the Add Book form. Saves nothing; "not found" is a normal answer. */
  lookupIsbnDetails(isbn: string) {
    return this.apiRequest<IsbnDetailsLookup>("/librarian/isbn/lookup", { method: "POST", body: { isbn } });
  }

  /**
   * Asks ONE catalogue about an ISBN and says how it went, so the progress list can show each one as it finishes.
   * `retry` asks again even if that catalogue failed to answer a moment ago. The answer is remembered by the server,
   * so the {@link lookupIsbnDetails} call that follows does not ask the catalogues again.
   */
  lookupIsbnSource(isbn: string, source: IsbnSourceName, retry = false) {
    return this.apiRequest<IsbnSourceCheck>("/librarian/isbn/lookup/source", { method: "POST", body: { isbn, source, retry } });
  }

  /** The "check these Dewey numbers" list. */
  fetchDeweyReview(params: { search?: string; page?: number; perPage?: number } = {}) {
    const runtimeConfig = useRuntimeConfig();

    return $fetch<DeweyReviewResponse>("/librarian/books/dewey-review", {
      baseURL: runtimeConfig.public.apiBaseURL,
      method: "GET",
      query: params,
      headers: { Accept: "application/json", ...this.authHeaders() },
    });
  }

  /** Looks one book's ISBN up and applies the number if one is found. */
  lookupBookDewey(bookUuid: string) {
    return this.apiRequest<DeweyApplied>(`/librarian/books/${bookUuid}/dewey/lookup`, { method: "POST" });
  }

  /** A librarian typed the right number: used as is, and counted as checked. */
  setBookDewey(bookUuid: string, deweyNumber: string) {
    return this.apiRequest<DeweyApplied>(`/librarian/books/${bookUuid}/dewey`, { method: "PUT", body: { deweyNumber } });
  }

  /** A walk-in without an account: just a typed name and purpose. */
  logVisitor(payload: { name: string; purpose: string }) {
    return this.apiRequest<{ message: string; log: AttendanceLog }>("/librarian/attendance-logs/visitor", {
      method: "POST",
      body: payload,
    });
  }

  checkOutVisitor(uuid: string) {
    return this.apiRequest<{ message: string; log: AttendanceLog }>(`/librarian/attendance-logs/${uuid}/visitor-checkout`, {
      method: "POST",
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

  fetchBook(bookUuid: string) {
    return this.apiRequest<{ book: BookDetail }>(`/librarian/books/${bookUuid}`);
  }

  /** Adds photos to the end of a section, in the order given. Photos are compressed first (compressPagePhoto). */
  uploadBookPages(bookUuid: string, section: BookPageSection, photos: Blob[]) {
    const body = new FormData();
    body.append("section", section);
    photos.forEach((photo, i) => body.append("photos[]", photo, `page-${i + 1}.jpg`));
    return this.apiRequest<{ message: string; pages: BookPagePhoto[] }>(`/librarian/books/${bookUuid}/pages`, { method: "POST", body });
  }

  reorderBookPages(bookUuid: string, section: BookPageSection, pageIDs: number[]) {
    return this.apiRequest<{ message: string }>(`/librarian/books/${bookUuid}/pages/order`, { method: "PUT", body: { section, pageIDs } });
  }

  deleteBookPage(pageUuid: string) {
    return this.apiRequest<{ message: string }>(`/librarian/book-pages/${pageUuid}`, { method: "DELETE" });
  }

  /** Same fields as createBook; `quantity` here is the new number of copies (0 retires them all). */
  updateBook(bookUuid: string, payload: Partial<NewBookPayload> & { quantity?: number }) {
    return this.apiRequest<{ message: string }>(`/librarian/books/${bookUuid}`, { method: "PATCH", body: payload });
  }

  /** Everything tied to a book (copies, loans, fines, reservations, wishlists, photos, log), shown before it is removed. */
  fetchBookRemovalSummary(bookUuid: string) {
    return this.apiRequest<BookRemovalSummary>(`/librarian/books/${bookUuid}/removal-summary`);
  }

  deleteBook(bookUuid: string) {
    return this.apiRequest<{ message: string }>(`/librarian/books/${bookUuid}`, { method: "DELETE" });
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

  approveBookSuggestion(suggestionUuid: string) {
    const runtimeConfig = useRuntimeConfig();

    return $fetch<{ message: string; suggestion: BookSuggestion }>(
      `/librarian/book-suggestions/${suggestionUuid}/approve`,
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

  /** The approved book is in the library: the student who asked for it is told. */
  markBookSuggestionArrived(suggestionUuid: string) {
    const runtimeConfig = useRuntimeConfig();

    return $fetch<{ message: string; suggestion: BookSuggestion }>(
      `/librarian/book-suggestions/${suggestionUuid}/arrived`,
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

  /** Turning a request down needs a reason; the student is told it. */
  rejectBookSuggestion(suggestionUuid: string, reason: string) {
    const runtimeConfig = useRuntimeConfig();

    return $fetch<{ message: string; suggestion: BookSuggestion }>(
      `/librarian/book-suggestions/${suggestionUuid}/reject`,
      {
        baseURL: runtimeConfig.public.apiBaseURL,
        method: "POST",
        body: { reason },
        headers: {
          Accept: "application/json",
          ...this.authHeaders(),
        },
      },
    );
  }

  fetchStudents(params: { search?: string; program?: string; status?: string; memberType?: "student" | "faculty" | "staff" | "members"; sort?: "oldest" | "newest"; /** Only students who are in the library right now. */ inLibrary?: boolean; page?: number; perPage?: number } = {}) {
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

  fetchStudentStats(memberType?: "student" | "faculty" | "staff" | "members") {
    const runtimeConfig = useRuntimeConfig();

    return $fetch<StudentStats>("/librarian/students/stats", {
      baseURL: runtimeConfig.public.apiBaseURL,
      method: "GET",
      query: { memberType },
      headers: {
        Accept: "application/json",
        ...this.authHeaders(),
      },
    });
  }

  approveStudent(studentUuid: string) {
    const runtimeConfig = useRuntimeConfig();

    return $fetch<{ message: string; student: StudentRecord }>(`/librarian/students/${studentUuid}/approve`, {
      baseURL: runtimeConfig.public.apiBaseURL,
      method: "POST",
      headers: {
        Accept: "application/json",
        ...this.authHeaders(),
      },
    });
  }

  /** The student is told the reason, in the app and by email. */
  rejectStudent(studentUuid: string, reason: string) {
    const runtimeConfig = useRuntimeConfig();

    return $fetch<{ message: string; student: StudentRecord }>(`/librarian/students/${studentUuid}/reject`, {
      baseURL: runtimeConfig.public.apiBaseURL,
      method: "POST",
      body: { reason },
      headers: {
        Accept: "application/json",
        ...this.authHeaders(),
      },
    });
  }
}

export const librarianService = new LibrarianServiceClass();
