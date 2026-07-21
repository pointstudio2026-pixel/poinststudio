import type { AdminRepository } from "@/modules/admin/domain/AdminRepository";
import type { ChangeUserRoleInput } from "@/modules/admin/schemas/admin.schemas";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError, ValidationError } from "@/shared/errors/AppError";

/** Super Admin 전용(라우트에서 requireAdminTier(["super_admin"])로 게이팅). */
export class ChangeUserRoleUseCase {
  constructor(private readonly adminRepository: AdminRepository) {}

  async execute(
    input: { targetUserId: string; actingUserId: string } & ChangeUserRoleInput,
  ): Promise<void> {
    if (input.targetUserId === input.actingUserId) {
      throw new ValidationError("자기 자신의 권한은 변경할 수 없습니다.");
    }
    const target = await this.adminRepository.getUserById(input.targetUserId);
    if (!target) {
      throw new NotFoundError("사용자를 찾을 수 없습니다.", "ADMIN_USER_NOT_FOUND");
    }

    await this.adminRepository.changeUserRole(input.targetUserId, input.role, input.adminTier ?? null);

    await recordActivity({
      userId: input.actingUserId,
      eventType: "ADMIN_USER_ROLE_CHANGED",
      payload: { targetUserId: input.targetUserId, role: input.role, adminTier: input.adminTier ?? null },
    });
  }
}
