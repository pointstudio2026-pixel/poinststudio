import type { GuestMockupUsageRepository } from "@/modules/mockups/domain/GuestMockupUsageRepository";
import { recordActivity } from "@/shared/activity/activityLogger";

export interface ClaimGuestMockupsOutput {
  claimedCount: number;
}

/**
 * 게스트가 회원가입/로그인하는 순간 호출 -- guestId 소유의 미claim 목업을
 * 전부 새 계정으로 이전한다. claimAllForGuest 자체가 멱등(이미 다른
 * 소유자로 넘어간 행은 재할당 안 함)이라 이 유스케이스도 여러 번
 * 호출해도 안전하다.
 */
export class ClaimGuestMockupsUseCase {
  constructor(private readonly guestMockupUsageRepository: GuestMockupUsageRepository) {}

  async execute(input: { guestId: string; userId: string }): Promise<ClaimGuestMockupsOutput> {
    const result = await this.guestMockupUsageRepository.claimAllForGuest(input.guestId, input.userId);
    if (result.claimedCount > 0) {
      await recordActivity({
        userId: input.userId,
        eventType: "GUEST_MOCKUPS_CLAIMED",
        payload: { claimedCount: result.claimedCount, guestId: input.guestId },
      });
    }
    return result;
  }
}
