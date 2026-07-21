import type { AdminRepository } from "@/modules/admin/domain/AdminRepository";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError } from "@/shared/errors/AppError";

export class UnsuspendUserUseCase {
  constructor(private readonly adminRepository: AdminRepository) {}

  async execute(input: { targetUserId: string; actingUserId: string }): Promise<void> {
    const target = await this.adminRepository.getUserById(input.targetUserId);
    if (!target) {
      throw new NotFoundError("사용자를 찾을 수 없습니다.", "ADMIN_USER_NOT_FOUND");
    }

    await this.adminRepository.unsuspendUser(input.targetUserId);

    await recordActivity({
      userId: input.actingUserId,
      eventType: "ADMIN_USER_UNSUSPENDED",
      payload: { targetUserId: input.targetUserId },
    });
  }
}
