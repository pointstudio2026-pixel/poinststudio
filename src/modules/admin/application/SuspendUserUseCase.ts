import type { AdminRepository } from "@/modules/admin/domain/AdminRepository";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError, ValidationError } from "@/shared/errors/AppError";

export class SuspendUserUseCase {
  constructor(private readonly adminRepository: AdminRepository) {}

  async execute(input: { targetUserId: string; actingUserId: string }): Promise<void> {
    if (input.targetUserId === input.actingUserId) {
      throw new ValidationError("자기 자신을 정지할 수 없습니다.");
    }
    const target = await this.adminRepository.getUserById(input.targetUserId);
    if (!target) {
      throw new NotFoundError("사용자를 찾을 수 없습니다.", "ADMIN_USER_NOT_FOUND");
    }

    await this.adminRepository.suspendUser(input.targetUserId);

    await recordActivity({
      userId: input.actingUserId,
      eventType: "ADMIN_USER_SUSPENDED",
      payload: { targetUserId: input.targetUserId },
    });
  }
}
