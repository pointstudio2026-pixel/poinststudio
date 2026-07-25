import type { GiftCode } from "@/modules/giftCodes/domain/GiftCode";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";

export interface CreateGiftCodeInput {
  code: string;
  planCode: PlanCode;
  grantDays: number;
  batchLabel: string | null;
  expiresAt: Date | null;
  createdByUserId: string;
}

export interface GiftCodeRepository {
  createMany(inputs: CreateGiftCodeInput[]): Promise<GiftCode[]>;
  findByCode(code: string): Promise<GiftCode | null>;
  markRedeemed(id: string, userId: string, redeemedAt: Date): Promise<GiftCode>;
  /** 관리자 화면용 -- 최신순, batchLabel로 필터(선택). */
  list(input?: { batchLabel?: string; limit?: number }): Promise<GiftCode[]>;
}
