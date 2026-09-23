import { BaseService } from "./BaseService";
import type { Area } from "~/utils/session";

/* ---------- shapes the app works with ---------- */

export interface BookBrief {
  bookID: number;
  title: string;
  coverImageURL: string | null;
  subject: { subjectID: number; name: string } | null;
  authors: string[];
}

export interface CatalogBook extends BookBrief {
  callNumber: string | null;
  isbn: string | null;
  publicationYear: number | null;
  shelfLocation: string | null;
  circulationType: string;
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
  studentIDNumber: string;
  academicProgram: string | null;
  barcodeValue: string | null;
  registrationStatus: string;
}

export interface StudentStats {
  activeLoans: number;
  overdueLoans: number;
  readyReservations: number;
  activeReservations: number;
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

export type LoanStatus = "Active" | "Reported" | "Returned";

export interface LoanRow {
  loanID: number;
  status: LoanStatus;
  checkoutDate: string;
  dueDate: string;
  returnDate: string | null;
  /** Whole days until due; negative once overdue. */
  daysLeft: number;
  book: BookBrief;
}

export interface PenaltyRow {
  penaltyID: number;
  amount: number;
  paymentStatus: "Unpaid" | "Paid" | string;
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
  title: string;
  coverImageURL?: string | null;
  subject?: { subjectID: number; name: string } | null;
  authors?: { name: string }[];
  copies?: { status: string }[];
}

export interface WishlistRow {
  wishlistID: number;
  bookID: number;
  inCart: boolean;
  /** Hearted. A row can be in the cart without being hearted. */
  inWishlist: boolean;
  addedAt: string;
  book: RawBook;
}

export type ReservationStatus = "Waiting" | "Accepted" | "Rejected" | "Fulfilled";

export interface ReservationRow {
  reservationID: number;
  bookID: number;
  status: ReservationStatus;
  reservedAt: string;
  queuePosition: number | null;
  book: RawBook;
}

export interface AchievementRow {
  achievementID: number;
  name: string;
  pointsReward: number;
  criteria: { metric: "knowledgeScore" | "visitStreak"; threshold: number } | null;
  status: "Locked" | "Unlocked" | "Redeemed";
  earnedAt: string | null;
  redeemedAt: string | null;
}

export interface MarketItem {
  itemID: number;
  name: string;
  type: string | null;
  pointCost: number;
  stock: number;
  inStock: boolean;
  affordable: boolean;
}

export interface MarketCartLine {
  cartItemID: number;
  itemID: number;
  quantity: number;
  item: { itemID: number; name: string; type: string | null; pointCost: number; stock: number };
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
  status: "Pending" | "Approved" | "Rejected" | string;
  submittedAt: string;
}

export interface CatalogQuery {
  search?: string;
  subjectID?: number;
  availableOnly?: boolean;
  page?: number;
  perPage?: number;
}

/** Same shape whether a book arrives from the catalog or as a raw Eloquent row. */
export function briefOf(book: RawBook | BookBrief): BookBrief {
  const authors = (book.authors ?? []).map((a) => (typeof a === "string" ? a : a.name));
  return {
    bookID: book.bookID,
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

  /** The contact details a student may change themselves. Returns the refreshed profile. */
  updateContact(body: { phoneNumber: string | null; address: string | null; birthDate: string | null }) {
    return this.apiRequest<ProfileResponse & { message: string }>("/student/profile", { method: "PATCH", body });
  }

  changePassword(body: { currentPassword: string; newPassword: string; newPassword_confirmation: string }) {
    return this.apiRequest<{ message: string }>("/student/password", { method: "PUT", body });
  }

  loans() {
    return this.apiRequest<{ loans: LoanRow[] }>("/student/loans");
  }

  penalties() {
    return this.apiRequest<{ penalties: PenaltyRow[]; unpaidTotal: number }>("/student/penalties");
  }

  attendance() {
    return this.apiRequest<{ visits: VisitRow[]; recentDates: string[] }>("/student/attendance");
  }

  redemptions() {
    return this.apiRequest<{ redemptions: RedemptionRow[] }>("/student/redemptions");
  }

  catalog(query: CatalogQuery = {}) {
    return this.apiRequest<Paginated<CatalogBook>>("/student/catalog", {
      query: {
        search: query.search || undefined,
        subjectID: query.subjectID || undefined,
        availableOnly: query.availableOnly ? 1 : undefined,
        page: query.page,
        perPage: query.perPage,
      },
    });
  }

  catalogBook(bookID: number) {
    return this.apiRequest<{ book: CatalogBook }>(`/student/catalog/${bookID}`);
  }

  subjects() {
    return this.apiRequest<{ subjects: { subjectID: number; name: string; books: number }[] }>("/student/catalog/subjects");
  }

  wishlist() {
    return this.apiRequest<{ wishlist: WishlistRow[] }>("/student/wishlist");
  }

  addToWishlist(bookID: number) {
    return this.apiRequest<{ message: string }>("/student/wishlist", { method: "POST", body: { bookID } });
  }

  removeFromWishlist(wishlistID: number) {
    return this.apiRequest<{ message: string }>(`/student/wishlist/${wishlistID}`, { method: "DELETE" });
  }

  addToCart(bookID: number) {
    return this.apiRequest<{ message: string }>("/student/cart", { method: "POST", body: { bookID } });
  }

  removeFromCart(wishlistID: number) {
    return this.apiRequest<{ message: string }>(`/student/cart/${wishlistID}`, { method: "DELETE" });
  }

  reservations() {
    return this.apiRequest<{ reservations: ReservationRow[] }>("/student/reservations");
  }

  reserveCart() {
    return this.apiRequest<{ message: string; reservations: { reservationID: number; bookID: number }[] }>(
      "/student/reservations",
      { method: "POST" },
    );
  }

  cancelReservation(reservationID: number) {
    return this.apiRequest<{ message: string }>(`/student/reservations/${reservationID}`, { method: "DELETE" });
  }

  selfReturn(loanID: number) {
    return this.apiRequest<{ message: string }>(`/student/loans/${loanID}/self-return`, { method: "POST" });
  }

  achievements() {
    return this.apiRequest<{ achievements: AchievementRow[] }>("/student/achievements");
  }

  redeemAchievement(achievementID: number) {
    return this.apiRequest<{ message: string }>(`/student/achievements/${achievementID}/redeem`, { method: "POST" });
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

  updateMarketCartLine(cartItemID: number, quantity: number) {
    return this.apiRequest<{ message: string }>(`/student/market-cart/${cartItemID}`, { method: "PATCH", body: { quantity } });
  }

  removeMarketCartLine(cartItemID: number) {
    return this.apiRequest<{ message: string }>(`/student/market-cart/${cartItemID}`, { method: "DELETE" });
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
