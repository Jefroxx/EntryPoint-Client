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
  redemptions_count: number;
}

export interface MarketItemPayload {
  name: string;
  type?: string | null;
  pointCost: number;
  stock: number;
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
    return this.apiRequest<{ message: string }>("/librarian/market-items", { method: "POST", body: payload });
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
