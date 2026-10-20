import { BaseService } from "./BaseService";

/** What an achievement can be about (knowledgeScore, visitStreak, booksBorrowed, …). The server owns the list. */
export type AchievementMetric = string;

/** One choice in "Unlocks when": its key, the sentence it reads as, and what its number counts. */
export interface AchievementMetricInfo {
  key: AchievementMetric;
  label: string;
  unit: string;
  /** How a goal reads to students, with {n} for the number; `one` is the wording for exactly 1. */
  goal?: string;
  one?: string;
}

export interface AchievementRecord {
  achievementID: number;
  uuid: string;
  name: string;
  criteriaJSON: { metric: AchievementMetric; threshold: number };
  /** The goal in plain words, e.g. "Borrow 5 books". */
  description?: string;
  pointsReward: number;
  unlockedCount: number;
  redeemedCount: number;
}

/** One student who unlocked an achievement (GET /librarian/achievements/{uuid}/students). */
export interface AchievementStudent {
  studentID: number;
  name: string;
  studentIDNumber: string | null;
  academicProgram: string | null;
  earnedAt: string | null;
  /** When the reward was redeemed; null while it is not. */
  redeemedAt: string | null;
}

export interface AchievementPayload {
  name: string;
  criteriaJSON: { metric: AchievementMetric; threshold: number };
  pointsReward: number;
}

export interface MarketItemRecord {
  itemID: number;
  uuid: string;
  name: string;
  type: string | null;
  pointCost: number;
  stock: number;
  photoURL: string | null;
  redemptions_count: number;
}

export interface MarketItemPayload {
  name: string;
  type?: string | null;
  pointCost: number;
  stock: number;
}

/** What to do with an item's photo on save: upload a new one, remove the current one, or leave it. */
export interface MarketItemPhotoChange {
  blob: Blob | null;
  remove: boolean;
}

export type FulfillmentStatus = "Pending" | "Fulfilled" | "Cancelled";

export interface RedemptionRecord {
  redemptionID: number;
  uuid: string;
  quantity: number;
  pointsSpent: number;
  fulfillmentStatus: FulfillmentStatus;
  redeemedAt: string;
  student: {
    studentID: number;
    studentIDNumber?: string;
    academicProgram?: string | null;
    /** The student's points balance now. */
    knowledgeScore?: number;
    user: { firstName: string; lastName: string; email?: string } | null;
  } | null;
  item: { itemID: number; name: string; type?: string | null; pointCost?: number; stock?: number } | null;
}

class EngagementServiceClass extends BaseService {
  fetchAchievements() {
    return this.apiRequest<{ achievements: AchievementRecord[]; metrics: AchievementMetricInfo[] }>("/librarian/achievements");
  }

  fetchAchievementStudents(achievementUuid: string) {
    return this.apiRequest<{ students: AchievementStudent[] }>(`/librarian/achievements/${achievementUuid}/students`);
  }

  createAchievement(payload: AchievementPayload) {
    return this.apiRequest<{ message: string }>("/librarian/achievements", { method: "POST", body: payload });
  }

  updateAchievement(achievementUuid: string, payload: Partial<AchievementPayload>) {
    return this.apiRequest<{ message: string }>(`/librarian/achievements/${achievementUuid}`, { method: "PATCH", body: payload });
  }

  deleteAchievement(achievementUuid: string) {
    return this.apiRequest<{ message: string }>(`/librarian/achievements/${achievementUuid}`, { method: "DELETE" });
  }

  fetchMarketItems() {
    return this.apiRequest<{ items: MarketItemRecord[] }>("/librarian/market-items");
  }

  createMarketItem(payload: MarketItemPayload) {
    return this.apiRequest<{ message: string; item: Omit<MarketItemRecord, "redemptions_count"> }>("/librarian/market-items", { method: "POST", body: payload });
  }

  /** Sets or replaces the item's photo. Compress it first (compressPagePhoto). */
  uploadMarketItemPhoto(itemUuid: string, photo: Blob) {
    const body = new FormData();
    body.append("photo", photo, "item.jpg");
    return this.apiRequest<{ message: string }>(`/librarian/market-items/${itemUuid}/photo`, { method: "POST", body });
  }

  deleteMarketItemPhoto(itemUuid: string) {
    return this.apiRequest<{ message: string }>(`/librarian/market-items/${itemUuid}/photo`, { method: "DELETE" });
  }

  updateMarketItem(itemUuid: string, payload: Partial<MarketItemPayload>) {
    return this.apiRequest<{ message: string }>(`/librarian/market-items/${itemUuid}`, { method: "PATCH", body: payload });
  }

  deleteMarketItem(itemUuid: string) {
    return this.apiRequest<{ message: string }>(`/librarian/market-items/${itemUuid}`, { method: "DELETE" });
  }

  fetchRedemptions() {
    return this.apiRequest<{ redemptions: RedemptionRecord[] }>("/librarian/point-redemptions");
  }

  fulfillRedemption(redemptionUuid: string) {
    return this.apiRequest<{ message: string }>(`/librarian/point-redemptions/${redemptionUuid}/fulfill`, { method: "POST" });
  }

  cancelRedemption(redemptionUuid: string) {
    return this.apiRequest<{ message: string }>(`/librarian/point-redemptions/${redemptionUuid}/cancel`, { method: "POST" });
  }
}

export const engagementService = new EngagementServiceClass();
