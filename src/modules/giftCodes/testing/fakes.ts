import type { GiftCode } from "@/modules/giftCodes/domain/GiftCode";
import type {
  CreateGiftCodeInput,
  GiftCodeRepository,
} from "@/modules/giftCodes/domain/GiftCodeRepository";

interface FakeRedemption {
  giftCodeId: string;
  userId: string;
  redeemedAt: Date;
}

export class FakeGiftCodeRepository implements GiftCodeRepository {
  codes: GiftCode[] = [];
  redemptions: FakeRedemption[] = [];
  private nextId = 1;

  async createMany(inputs: CreateGiftCodeInput[]): Promise<GiftCode[]> {
    const created = inputs.map((input) => ({
      id: `gift-code-${this.nextId++}`,
      code: input.code,
      planCode: input.planCode,
      grantDays: input.grantDays,
      batchLabel: input.batchLabel,
      expiresAt: input.expiresAt,
      maxRedemptions: input.maxRedemptions ?? 1,
      redemptionCount: 0,
      redeemedByUserId: null,
      redeemedAt: null,
      createdByUserId: input.createdByUserId,
      createdAt: new Date(),
    }));
    this.codes.push(...created);
    return created;
  }

  async findByCode(code: string): Promise<GiftCode | null> {
    return this.codes.find((c) => c.code === code) ?? null;
  }

  async hasUserRedeemed(giftCodeId: string, userId: string): Promise<boolean> {
    return this.redemptions.some((r) => r.giftCodeId === giftCodeId && r.userId === userId);
  }

  async recordRedemption(giftCodeId: string, userId: string, redeemedAt: Date): Promise<GiftCode> {
    this.redemptions.push({ giftCodeId, userId, redeemedAt });
    const index = this.codes.findIndex((c) => c.id === giftCodeId);
    if (index === -1) throw new Error(`FakeGiftCodeRepository: code ${giftCodeId} not found`);
    const existing = this.codes[index]!;
    const updated: GiftCode = {
      ...existing,
      redemptionCount: existing.redemptionCount + 1,
      redeemedByUserId: existing.redeemedByUserId ?? userId,
      redeemedAt: existing.redeemedAt ?? redeemedAt,
    };
    this.codes[index] = updated;
    return updated;
  }

  async list(input?: { batchLabel?: string; limit?: number }): Promise<GiftCode[]> {
    const filtered = input?.batchLabel ? this.codes.filter((c) => c.batchLabel === input.batchLabel) : this.codes;
    return [...filtered].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, input?.limit ?? 200);
  }
}
