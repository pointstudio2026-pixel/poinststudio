import type { GuestMockupUsageRepository } from "@/modules/mockups/domain/GuestMockupUsageRepository";
import { GUEST_MOCKUP_LIFETIME_LIMIT } from "@/modules/mockups/domain/guestMockup";

export interface CheckGuestMockupLimitOutput {
  allowed: boolean;
  used: number;
  limit: number;
}

/**
 * CheckPlanUseCase(실제 로그인 유저, 월간 한도)와 같은 모양이지만, 게스트는
 * guestId당 평생 GUEST_MOCKUP_LIFETIME_LIMIT회로 완전히 별개 축이다.
 */
export class CheckGuestMockupLimitUseCase {
  constructor(private readonly guestMockupUsageRepository: GuestMockupUsageRepository) {}

  async execute(input: { guestId: string }): Promise<CheckGuestMockupLimitOutput> {
    const used = await this.guestMockupUsageRepository.countByGuestId(input.guestId);
    return { allowed: used < GUEST_MOCKUP_LIFETIME_LIMIT, used, limit: GUEST_MOCKUP_LIFETIME_LIMIT };
  }
}
