import type { AdminRepository } from "@/modules/admin/domain/AdminRepository";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError, ValidationError } from "@/shared/errors/AppError";

/** Super Admin 전용(라우트에서 requireAdminTier(["super_admin"])로 게이팅). */
export class DeleteUserUseCase {
  constructor(private readonly adminRepository: AdminRepository) {}

  async execute(input: { targetUserId: string; actingUserId: string }): Promise<void> {
    if (input.targetUserId === input.actingUserId) {
      throw new ValidationError("자기 자신을 삭제할 수 없습니다.");
    }
    const target = await this.adminRepository.getUserById(input.targetUserId);
    if (!target) {
      throw new NotFoundError("사용자를 찾을 수 없습니다.", "ADMIN_USER_NOT_FOUND");
    }

    // 소프트 삭제 -- deletedAt이 설정되면 LoginUseCase/OAuthLoginUseCase/
    // RefreshTokenUseCase가 즉시 로그인·세션 갱신을 막는다.
    await this.adminRepository.softDeleteUser(input.targetUserId);

    await recordActivity({
      userId: input.actingUserId,
      eventType: "ADMIN_USER_DELETED",
      payload: { targetUserId: input.targetUserId },
    });
  }
}
