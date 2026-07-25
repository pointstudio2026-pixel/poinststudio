import type { GiftCodeRepository } from "@/modules/giftCodes/domain/GiftCodeRepository";
import { normalizeGiftCode } from "@/modules/giftCodes/domain/giftCodeRules";
import type { SubscriptionRepository } from "@/modules/subscriptions/domain/SubscriptionRepository";
import type { Subscription } from "@/modules/subscriptions/domain/Subscription";
import { ConflictError, NotFoundError, ValidationError } from "@/shared/errors/AppError";
import { recordActivity } from "@/shared/activity/activityLogger";

export interface RedeemGiftCodeInput {
  userId: string;
  code: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * 무료 이용자가 선물 코드를 등록하면 코드에 지정된 요금제를 grantDays일
 * 동안 부여한다(2026-07-25) -- 이미 유료 요금제(Pro/Studio)를 쓰는
 * 사용자는 사용할 수 없다(사용자 결정: "무료 사용자만 사용 가능"). AI
 * 호출 없음, 비용 0.
 */
export class RedeemGiftCodeUseCase {
  constructor(
    private readonly giftCodeRepository: GiftCodeRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async execute(input: RedeemGiftCodeInput): Promise<Subscription> {
    const normalized = normalizeGiftCode(input.code);
    const giftCode = await this.giftCodeRepository.findByCode(normalized);
    if (!giftCode) {
      throw new NotFoundError("유효하지 않은 선물 코드입니다.", "GIFT-001");
    }
    if (giftCode.redeemedByUserId) {
      throw new ConflictError("이미 사용된 선물 코드입니다.", "GIFT-002");
    }
    if (giftCode.expiresAt && giftCode.expiresAt < new Date()) {
      throw new ValidationError("등록 기간이 지난 선물 코드입니다.");
    }

    const subscription =
      (await this.subscriptionRepository.findByUserId(input.userId)) ??
      (await this.subscriptionRepository.createDefault(input.userId));
    if (subscription.planCode !== "free") {
      throw new ConflictError("이미 유료 요금제를 이용 중이라 선물 코드를 사용할 수 없습니다.", "GIFT-003");
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + giftCode.grantDays * MS_PER_DAY);
    const updated = await this.subscriptionRepository.grantTemporaryPlan(
      input.userId,
      giftCode.planCode,
      now,
      periodEnd,
    );
    await this.giftCodeRepository.markRedeemed(giftCode.id, input.userId, now);

    await recordActivity({
      userId: input.userId,
      eventType: "GIFT_CODE_REDEEMED",
      payload: { giftCodeId: giftCode.id, planCode: giftCode.planCode, periodEnd: periodEnd.toISOString() },
    });

    return updated;
  }
}
