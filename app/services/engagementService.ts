import { BaseService } from "./BaseService";

export type AchievementMetric = "knowledgeScore" | "visitStreak";

export interface AchievementRecord {
  achievementID: number;
  uuid: string;
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
