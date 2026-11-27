import { BaseService } from "./BaseService";
import type { LoanReceipt } from "./circulationService";
import type { BookPagePhoto } from "~/utils/bookPages";
import type { Area } from "~/utils/session";
import type { Announcement } from "./announcementService";

/* ---------- shapes the app works with ---------- */

export interface BookBrief {
  bookID: number;
  uuid: string;
  title: string;
  coverImageURL: string | null;
  /** The librarian ticked "new arrival" when adding it. */
  isNewArrival?: boolean;
  subject: { subjectID: number; name: string } | null;
  authors: string[];
}

export interface CatalogBook extends BookBrief {
  callNumber: string | null;
  isbn: string | null;
  publicationYear: number | null;
  shelfLocation: string | null;
  circulationType: string;
  /** Where it is in the library (Circulation, Filipiniana, ...): what students browse by. */
  area?: { key: string; name: string };
  totalCopies: number;
  availableCopies: number;
  queueLength: number;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export interface StudentProfile {
  firstName: string;
  middleInitial: string | null;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  address: string | null;
  /** YYYY-MM-DD */
  birthDate: string | null;
  memberIDNumber: string;
  academicProgram: string | null;
  /** Faculty and staff members have a department instead of a program, and no points or rewards. */
  memberType?: "student" | "faculty" | "staff";
  department?: string | null;
  barcodeValue: string | null;
  registrationStatus: string;
}

export interface StudentStats {
  activeLoans: number;
  overdueLoans: number;
  readyReservations: number;
  activeReservations: number;
  /** The most books a student can have at a time, as the library set it. */
  maxBooks: number;
  slotsLeft: number;
  unpaidFines: number;
  wishlistCount: number;
  cartCount: number;
}

export interface ProfileResponse {
  profile: StudentProfile;
  points: number;
  visitStreak: number;
  stats: StudentStats;
}

/** Received: the student handed it in and a librarian is checking it. */
export type LoanStatus = "Active" | "Reported" | "Received" | "Returned";

export interface LoanRow {
  loanID: number;
  uuid: string;
  status: LoanStatus;
  checkoutDate: string;
  dueDate: string;
  returnDate: string | null;
  /** Whole days until due; negative once overdue. */
  daysLeft: number;
  /** Why the librarian rejected the student's last return report (null when it wasn't rejected). */
  rejectionReason?: string | null;
  /** When that rejected return can be reported again. */
  canReportAgainAt?: string | null;
  book: BookBrief;
}

export interface PenaltyRow {
  penaltyID: number;
  uuid: string;
  /** What the librarian wrote happened to a lost or damaged book. */
  reason?: string | null;
  /** How the student said they will settle it: pay the amount, or bring a replacement copy. */
  studentChoice?: "pay" | "replace" | null;
  /** 'overdue' is a late fee; 'lost' / 'damaged' mean the book itself: pay its price or replace it. */
  kind: "overdue" | "lost" | "damaged";
  amount: number;
  paymentStatus: "Unpaid" | "Paid" | "Replaced" | string;
  computedAt: string;
  settledAt: string | null;
  loanReturned: boolean;
  rate: number | null;
  rateUnit: "day" | "hour";
  unitsLate: number;
  book: BookBrief;
}

export interface VisitRow {
  logID: number;
  entryTime: string;
  exitTime: string | null;
}

export interface RedemptionRow {
  redemptionID: number;
  itemName: string;
  quantity: number;
  pointsSpent: number;
  status: "Pending" | "Fulfilled" | "Cancelled" | string;
  redeemedAt: string;
}

/** Wishlist rows come back as raw Eloquent models (authors are objects). */
interface RawBook {
  bookID: number;
  uuid: string;
  title: string;
  coverImageURL?: string | null;
  subject?: { subjectID: number; name: string } | null;
  authors?: { name: string }[];
  copies?: { status: string }[];
  /** Copies free to promise right now (on the shelf, not held for an accepted reservation). Wishlist/cart rows only. */
  availableCopies?: number;
  /** People already waiting in line for it. Wishlist/cart rows only. */
  queueLength?: number;
}

export interface WishlistRow {
  wishlistID: number;
  uuid: string;
  bookID: number;
  inCart: boolean;
  /** Hearted. A row can be in the cart without being hearted. */
  inWishlist: boolean;
  addedAt: string;
  book: RawBook;
}

export type ReservationStatus = "Waiting" | "Accepted" | "Rejected" | "Fulfilled" | "Expired";

export interface ReservationRow {
  reservationID: number;
  uuid: string;
  bookID: number;
  status: ReservationStatus;
  reservedAt: string;
  queuePosition: number | null;
  /** The code on the pickup slip's barcode (R-000123); the desk scans it at checkout. */
  pickupCode: string;
  book: RawBook;
}

export interface HallOfFameLeader {
  rank: number;
  /** "First L." */
  name: string;
  initials: string;
  program: string | null;
  /** Librarian Dashboard only. */
  memberIDNumber?: string | null;
  value: number;
  isYou: boolean;
}

export interface HallOfFameCategory {
  key: string;
  title: string;
  blurb: string;
  icon: string;
  /** Singular; the page pluralises it ("1 day", "7 days"). */
  unit: string;
  /** month: this month, starts over on the 1st · now: right now · all: all time */
  period: "month" | "now" | "all";
  leaders: HallOfFameLeader[];
  /** Student view only: the viewer's own number in this category. */
  yourValue?: number;
}

export interface HallOfFame {
  month: string;
  categories: HallOfFameCategory[];
}

export interface AchievementRow {
  achievementID: number;
  uuid: string;
  name: string;
  pointsReward: number;
  criteria: { metric: string; threshold: number } | null;
  /** The goal in plain words, e.g. "Borrow 5 books". */
  description: string;
  /** Where the student is now, against the goal. */
  progress: { current: number; target: number };
  status: "Locked" | "Unlocked" | "Redeemed";
  earnedAt: string | null;
  redeemedAt: string | null;
}

export interface MarketItem {
  itemID: number;
  uuid: string;
  name: string;
  type: string | null;
  photoURL: string | null;
  pointCost: number;
  stock: number;
  inStock: boolean;
  affordable: boolean;
}

export interface MarketCartLine {
  cartItemID: number;
  uuid: string;
  itemID: number;
  quantity: number;
  item: { itemID: number; name: string; type: string | null; photoURL: string | null; pointCost: number; stock: number };
}

export interface ResourceRow {
  resID: number;
  resourceType: string;
  name: string;
  status: "Available" | "In Use" | "Unavailable" | string;
}

export interface SuggestionRow {
  suggestionID: number;
  title: string;
  author: string | null;
  reason: string | null;
  status: "Pending" | "Approved" | "Arrived" | "Rejected" | string;
  /** Why a rejected request was turned down. */
  rejectionReason?: string | null;
  submittedAt: string;
}

/** An area of the library with books in it (Discover's and Home's "browse by area"). */
export interface LibraryAreaCount {
  key: string;
  name: string;
  books: number;
}

export interface CatalogQuery {
  search?: string;
  subjectID?: number;
  /** An area of the library (its key, e.g. "filipiniana"). */
  area?: string;
  availableOnly?: boolean;
  /** Only the books the library marked as new arrivals, the most recently added first. */
  newArrivalsOnly?: boolean;
  page?: number;
  perPage?: number;
}

/** Same shape whether a book arrives from the catalog or as a raw Eloquent row. */
export function briefOf(book: RawBook | BookBrief): BookBrief {
  const authors = (book.authors ?? []).map((a) => (typeof a === "string" ? a : a.name));
  return {
    bookID: book.bookID,
    uuid: book.uuid,
    title: book.title,
    coverImageURL: book.coverImageURL ?? null,
    subject: book.subject ?? null,
    authors,
  };
}

/* ---------- requests ---------- */

class StudentServiceClass extends BaseService {
  // Always the student session, even if a librarian is signed in in another tab.
  protected override area(): Area {
    return "student";
  }

  profile() {
    return this.apiRequest<ProfileResponse>("/student/profile");
  }

  /** Everything Home shows, in one request (nine before). Same shapes as the separate endpoints below. */
  home() {
    return this.apiRequest<{
      loans: LoanRow[];
      reservations: ReservationRow[];
      attendance: { visits: VisitRow[]; recentDates: string[] };
      achievements: AchievementRow[];
      areas: LibraryAreaCount[];
      recommendations: { books: CatalogBook[]; subjects: string[]; classes?: string[]; loanCount: number };
      announcements: Announcement[];
      hallOfFame: HallOfFame | null;
      newArrivals: Paginated<CatalogBook>;
    }>("/student/home");
  }

  /** The contact details a student may change themselves. Returns the refreshed profile. */
  updateContact(body: { memberIDNumber?: string; phoneNumber: string | null; address: string | null; birthDate: string | null }) {
    return this.apiRequest<ProfileResponse & { message: string }>("/student/profile", { method: "PATCH", body });
  }

  changePassword(body: { currentPassword: string; newPassword: string; newPassword_confirmation: string }) {
    return this.apiRequest<{ message: string }>("/student/password", { method: "PUT", body });
  }

  loans() {
    return this.apiRequest<{ loans: LoanRow[] }>("/student/loans");
  }

  /** The checkout receipt for one of the student's own loans: a digital copy if the paper one is lost. */
  loanReceipt(loanUuid: string) {
    return this.apiRequest<{ receipt: LoanReceipt }>(`/student/loans/${loanUuid}/receipt`);
  }

  penalties() {
    return this.apiRequest<{ penalties: PenaltyRow[]; unpaidTotal: number }>("/student/penalties");
  }

  /** Lost or damaged book: say whether you will pay the amount or bring a replacement copy. */
  choosePenalty(penaltyUuid: string, choice: "pay" | "replace") {
    return this.apiRequest<{ message: string }>(`/student/penalties/${penaltyUuid}/choice`, { method: "POST", body: { choice } });
  }

  attendance() {
    return this.apiRequest<{ visits: VisitRow[]; recentDates: string[] }>("/student/attendance");
  }

  /** The Home page's Hall of Fame: the top three in each category, and where the viewer stands. */
  hallOfFame() {
    return this.apiRequest<HallOfFame>("/student/hall-of-fame");
  }

  redemptions() {
    return this.apiRequest<{ redemptions: RedemptionRow[] }>("/student/redemptions");
  }

  catalog(query: CatalogQuery = {}) {
    return this.apiRequest<Paginated<CatalogBook>>("/student/catalog", {
      query: {
        search: query.search || undefined,
        subjectID: query.subjectID || undefined,
        area: query.area || undefined,
        availableOnly: query.availableOnly ? 1 : undefined,
        newArrivalsOnly: query.newArrivalsOnly ? 1 : undefined,
        page: query.page,
        perPage: query.perPage,
      },
    });
  }

  catalogBook(bookUuid: string) {
    // One book in full: also its page photos, for "Look inside".
    return this.apiRequest<{ book: CatalogBook & { pages: BookPagePhoto[] } }>(`/student/catalog/${bookUuid}`);
  }

  subjects() {
    return this.apiRequest<{ subjects: { subjectID: number; name: string; books: number }[] }>("/student/catalog/subjects");
  }

  /** The areas of the library that hold books, in the library's order, with how many each holds. */
  areas() {
    return this.apiRequest<{ areas: LibraryAreaCount[] }>("/student/catalog/areas");
  }

  /** "Recommended for you": ranked by the subjects the student borrows most, then by what everyone borrows. */
  recommendations() {
    return this.apiRequest<{ books: CatalogBook[]; subjects: string[]; classes?: string[]; loanCount: number }>("/student/recommendations");
  }

  wishlist() {
    return this.apiRequest<{ wishlist: WishlistRow[] }>("/student/wishlist");
  }

  addToWishlist(bookID: number) {
    return this.apiRequest<{ message: string }>("/student/wishlist", { method: "POST", body: { bookID } });
  }

  removeFromWishlist(wishlistUuid: string) {
    return this.apiRequest<{ message: string }>(`/student/wishlist/${wishlistUuid}`, { method: "DELETE" });
  }

  addToCart(bookID: number) {
    return this.apiRequest<{ message: string }>("/student/cart", { method: "POST", body: { bookID } });
  }

  removeFromCart(wishlistUuid: string) {
    return this.apiRequest<{ message: string }>(`/student/cart/${wishlistUuid}`, { method: "DELETE" });
  }

  reservations() {
    return this.apiRequest<{ reservations: ReservationRow[] }>("/student/reservations");
  }

  /** Reserves the given cart rows, or the whole cart when none are named. */
  reserveCart(wishlistIDs?: number[]) {
    return this.apiRequest<{ message: string; reservations: { reservationID: number; bookID: number }[] }>(
      "/student/reservations",
      { method: "POST", ...(wishlistIDs ? { body: { wishlistIDs } } : {}) },
    );
  }

  cancelReservation(reservationUuid: string) {
    return this.apiRequest<{ message: string }>(`/student/reservations/${reservationUuid}`, { method: "DELETE" });
  }

  selfReturn(loanUuid: string) {
    return this.apiRequest<{ message: string }>(`/student/loans/${loanUuid}/self-return`, { method: "POST" });
  }

  achievements() {
    return this.apiRequest<{ achievements: AchievementRow[] }>("/student/achievements");
  }

  redeemAchievement(achievementUuid: string) {
    return this.apiRequest<{ message: string }>(`/student/achievements/${achievementUuid}/redeem`, { method: "POST" });
  }

  marketItems() {
    return this.apiRequest<{ points: number; items: MarketItem[] }>("/student/market-items");
  }

  marketCart() {
    return this.apiRequest<{ points: number; cart: MarketCartLine[]; total: number }>("/student/market-cart");
  }

  addToMarketCart(itemID: number, quantity = 1) {
    return this.apiRequest<{ message: string }>("/student/market-cart", { method: "POST", body: { itemID, quantity } });
  }

  updateMarketCartLine(cartItemUuid: string, quantity: number) {
    return this.apiRequest<{ message: string }>(`/student/market-cart/${cartItemUuid}`, { method: "PATCH", body: { quantity } });
  }

  removeMarketCartLine(cartItemUuid: string) {
    return this.apiRequest<{ message: string }>(`/student/market-cart/${cartItemUuid}`, { method: "DELETE" });
  }

  checkoutMarketCart() {
    return this.apiRequest<{ message: string }>("/student/market-cart/checkout", { method: "POST" });
  }

  resources() {
    return this.apiRequest<{ resources: ResourceRow[] }>("/student/resources");
  }

  suggestions() {
    return this.apiRequest<{ suggestions: SuggestionRow[] }>("/student/book-suggestions");
  }

  suggestBook(payload: { title: string; author?: string; reason?: string }) {
    return this.apiRequest<{ message: string }>("/student/book-suggestions", { method: "POST", body: payload });
  }
}

export const studentService = new StudentServiceClass();
