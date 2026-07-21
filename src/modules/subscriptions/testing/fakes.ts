import type { Subscription } from "@/modules/subscriptions/domain/Subscription";
import type { SubscriptionRepository } from "@/modules/subscriptions/domain/SubscriptionRepository";
import type {
  RecordUsageInput,
  UsageRepository,
} from "@/modules/subscriptions/domain/UsageRepository";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";

export class FakeSubscriptionRepository implements SubscriptionRepository {
  subscriptions = new Map<string, Subscription>();

  async findByUserId(userId: string) {
    return this.subscriptions.get(userId) ?? null;
  }

  async createDefault(userId: string) {
    const existing = this.subscriptions.get(userId);
    if (existing) return existing;
    const subscription: Subscription = {
      id: `sub-${this.subscriptions.size + 1}`,
      userId,
      planCode: "free",
      status: "active",
      currentPeriodStart: null,
      currentPeriodEnd: null,
    };
    this.subscriptions.set(userId, subscription);
    return subscription;
  }

  setPlan(userId: string, planCode: PlanCode) {
    const subscription = this.subscriptions.get(userId);
    if (subscription) {
      this.subscriptions.set(userId, { ...subscription, planCode });
    } else {
      this.subscriptions.set(userId, {
        id: `sub-${this.subscriptions.size + 1}`,
        userId,
        planCode,
        status: "active",
        currentPeriodStart: null,
        currentPeriodEnd: null,
      });
    }
  }

  async updatePlan(userId: string, planCode: PlanCode): Promise<Subscription> {
    this.setPlan(userId, planCode);
    return this.subscriptions.get(userId)!;
  }
}

interface StoredUsage extends RecordUsageInput {
  createdAt: Date;
}

export class FakeUsageRepository implements UsageRepository {
  records: StoredUsage[] = [];

  async record(input: RecordUsageInput) {
    this.records.push({ ...input, createdAt: new Date() });
  }

  /** Test-only: seed a usage row at an arbitrary point in time (월간 초기화 등). */
  seed(input: RecordUsageInput, createdAt: Date) {
    this.records.push({ ...input, createdAt });
  }

  async countSince(userId: string, eventType: string, since: Date) {
    return this.records
      .filter((r) => r.userId === userId && r.eventType === eventType && r.createdAt >= since)
      .reduce((sum, r) => sum + (r.quantity ?? 1), 0);
  }
}
