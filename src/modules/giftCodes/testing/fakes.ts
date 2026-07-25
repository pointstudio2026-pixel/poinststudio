import type { GiftCode } from "@/modules/giftCodes/domain/GiftCode";
import type {
  CreateGiftCodeInput,
  GiftCodeRepository,
} from "@/modules/giftCodes/domain/GiftCodeRepository";

export class FakeGiftCodeRepository implements GiftCodeRepository {
  codes: GiftCode[] = [];
  private nextId = 1;

  async createMany(inputs: CreateGiftCodeInput[]): Promise<GiftCode[]> {
    const created = inputs.map((input) => ({
      id: `gift-code-${this.nextId++}`,
      code: input.code,
      planCode: input.planCode,
      grantDays: input.grantDays,
      batchLabel: input.batchLabel,
      expiresAt: input.expiresAt,
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

  async markRedeemed(id: string, userId: string, redeemedAt: Date): Promise<GiftCode> {
    const index = this.codes.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`FakeGiftCodeRepository: code ${id} not found`);
    const updated = { ...this.codes[index]!, redeemedByUserId: userId, redeemedAt };
    this.codes[index] = updated;
    return updated;
  }

  async list(input?: { batchLabel?: string; limit?: number }): Promise<GiftCode[]> {
    const filtered = input?.batchLabel ? this.codes.filter((c) => c.batchLabel === input.batchLabel) : this.codes;
    return [...filtered].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, input?.limit ?? 200);
  }
}
