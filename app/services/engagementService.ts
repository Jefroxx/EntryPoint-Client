import { BaseService } from "./BaseService";

export type AchievementMetric = "knowledgeScore" | "visitStreak";

export interface AchievementRecord {
  achievementID: number;
  name: string;
  criteriaJSON: { metric: AchievementMetric; threshold: number };
  pointsReward: number;
  unlockedCount: number;
  redeemedCount: number;
}

export interface AchievementPayload {
  name: string;
  criteriaJSON: { metric: AchievementMetric; threshold: number };
  pointsReward: number;
}

export interface MarketItemRecord {
  itemID: number;
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
  quantity: number;
  pointsSpent: number;
  fulfillmentStatus: FulfillmentStatus;
  redeemedAt: string;
  student: { studentID: number; user: { firstName: string; lastName: string } | null } | null;
  item: { itemID: number; name: string } | null;
}

class EngagementServiceClass extends BaseService {
  fetchAchievements() {
    return this.apiRequest<{ achievements: AchievementRecord[] }>("/librarian/achievements");
  }

  createAchievement(payload: AchievementPayload) {
    return this.apiRequest<{ message: string }>("/librarian/achievements", { method: "POST", body: payload });
  }

  updateAchievement(achievementID: number, payload: Partial<AchievementPayload>) {
    return this.apiRequest<{ message: string }>(`/librarian/achievements/${achievementID}`, { method: "PATCH", body: payload });
  }

  deleteAchievement(achievementID: number) {
    return this.apiRequest<{ message: string }>(`/librarian/achievements/${achievementID}`, { method: "DELETE" });
  }

  fetchMarketItems() {
    return this.apiRequest<{ items: MarketItemRecord[] }>("/librarian/market-items");
  }

  createMarketItem(payload: MarketItemPayload) {
    return this.apiRequest<{ message: string; item: Omit<MarketItemRecord, "redemptions_count"> }>("/librarian/market-items", { method: "POST", body: payload });
  }

  /** Sets or replaces the item's photo. Compress it first (compressPagePhoto). */
  uploadMarketItemPhoto(itemID: number, photo: Blob) {
    const body = new FormData();
    body.append("photo", photo, "item.jpg");
    return this.apiRequest<{ message: string }>(`/librarian/market-items/${itemID}/photo`, { method: "POST", body });
  }

  deleteMarketItemPhoto(itemID: number) {
    return this.apiRequest<{ message: string }>(`/librarian/market-items/${itemID}/photo`, { method: "DELETE" });
  }

  updateMarketItem(itemID: number, payload: Partial<MarketItemPayload>) {
    return this.apiRequest<{ message: string }>(`/librarian/market-items/${itemID}`, { method: "PATCH", body: payload });
  }

  deleteMarketItem(itemID: number) {
    return this.apiRequest<{ message: string }>(`/librarian/market-items/${itemID}`, { method: "DELETE" });
  }

  fetchRedemptions() {
    return this.apiRequest<{ redemptions: RedemptionRecord[] }>("/librarian/point-redemptions");
  }

  fulfillRedemption(redemptionID: number) {
    return this.apiRequest<{ message: string }>(`/librarian/point-redemptions/${redemptionID}/fulfill`, { method: "POST" });
  }

  cancelRedemption(redemptionID: number) {
    return this.apiRequest<{ message: string }>(`/librarian/point-redemptions/${redemptionID}/cancel`, { method: "POST" });
  }
}

export const engagementService = new EngagementServiceClass();
