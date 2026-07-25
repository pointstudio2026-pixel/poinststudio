import type { GiftCodeRepository } from "@/modules/giftCodes/domain/GiftCodeRepository";
import type { GiftCode } from "@/modules/giftCodes/domain/GiftCode";

export interface ListGiftCodesInput {
  batchLabel?: string;
}

/** 관리자가 발급한 선물 코드 목록(사용 여부 포함)을 조회한다. */
export class ListGiftCodesUseCase {
  constructor(private readonly giftCodeRepository: GiftCodeRepository) {}

  async execute(input: ListGiftCodesInput = {}): Promise<GiftCode[]> {
    return this.giftCodeRepository.list({ batchLabel: input.batchLabel, limit: 500 });
  }
}
