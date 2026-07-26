import type { GiftCodeRepository } from "@/modules/giftCodes/domain/GiftCodeRepository";
import type { GiftCode } from "@/modules/giftCodes/domain/GiftCode";
import { generateGiftCode } from "@/modules/giftCodes/domain/giftCodeRules";
import type { PlanCode } from "@/modules/subscriptions/domain/planLimits";
import { ValidationError } from "@/shared/errors/AppError";
import { recordActivity } from "@/shared/activity/activityLogger";

const MAX_BATCH_SIZE = 500;

export interface GenerateGiftCodesInput {
  adminUserId: string;
  planCode: PlanCode;
  grantDays: number;
  count: number;
  batchLabel: string | null;
  expiresAt: Date | null;
  /** 코드 1개당 사용 가능 인원(예: PH 공개 프로모 코드는 10~) -- 생략 시 1(1인 전용). */
  maxRedemptions?: number;
}

/** 관리자가 이벤트/프로모션용 선물 코드를 한 번에 여러 개 발급한다(비용 없음, AI 호출 없음). */
export class GenerateGiftCodesUseCase {
  constructor(private readonly giftCodeRepository: GiftCodeRepository) {}

  async execute(input: GenerateGiftCodesInput): Promise<GiftCode[]> {
    if (input.planCode === "free") {
      throw new ValidationError("무료 요금제는 선물 코드로 발급할 수 없습니다.");
    }
    if (input.count < 1 || input.count > MAX_BATCH_SIZE) {
      throw new ValidationError(`한 번에 발급할 수 있는 코드는 1~${MAX_BATCH_SIZE}개입니다.`);
    }
    if (input.grantDays < 1) {
      throw new ValidationError("부여 기간은 1일 이상이어야 합니다.");
    }
    if (input.maxRedemptions !== undefined && input.maxRedemptions < 1) {
      throw new ValidationError("사용 가능 인원은 1명 이상이어야 합니다.");
    }

    const codes = new Set<string>();
    while (codes.size < input.count) {
      const remaining = input.count - codes.size;
      for (let i = 0; i < remaining; i += 1) {
        codes.add(generateGiftCode());
      }
      // 이론상 거의 발생하지 않지만, Set이 중복을 흡수해 remaining보다 적게
      // 늘었을 수 있으니 목표 개수에 도달할 때까지 반복한다.
    }

    const created = await this.giftCodeRepository.createMany(
      Array.from(codes)
        .slice(0, input.count)
        .map((code) => ({
          code,
          planCode: input.planCode,
          grantDays: input.grantDays,
          batchLabel: input.batchLabel,
          expiresAt: input.expiresAt,
          createdByUserId: input.adminUserId,
          maxRedemptions: input.maxRedemptions,
        })),
    );

    await recordActivity({
      userId: input.adminUserId,
      eventType: "ADMIN_GIFT_CODES_GENERATED",
      payload: { count: created.length, planCode: input.planCode, grantDays: input.grantDays, batchLabel: input.batchLabel },
    });

    return created;
  }
}
