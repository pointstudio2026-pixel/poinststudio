import type { GiftCode } from "@/modules/giftCodes/domain/GiftCode";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";

export interface CreateGiftCodeInput {
  code: string;
  planCode: PlanCode;
  grantDays: number;
  batchLabel: string | null;
  expiresAt: Date | null;
  createdByUserId: string;
  /** 생략 시 1(기존처럼 1인 전용). */
  maxRedemptions?: number;
}

export interface GiftCodeRepository {
  createMany(inputs: CreateGiftCodeInput[]): Promise<GiftCode[]>;
  findByCode(code: string): Promise<GiftCode | null>;
  /** 이 사용자가 이 코드를 이미 사용했는지(같은 사람이 다인용 코드를 두 번 못 쓰게). */
  hasUserRedeemed(giftCodeId: string, userId: string): Promise<boolean>;
  /** 사용 기록을 남기고(다인용이면 추가, 1인용이면 기존처럼) 갱신된 코드를 반환한다. */
  recordRedemption(giftCodeId: string, userId: string, redeemedAt: Date): Promise<GiftCode>;
  /** 관리자 화면용 -- 최신순, batchLabel로 필터(선택). */
  list(input?: { batchLabel?: string; limit?: number }): Promise<GiftCode[]>;
}
