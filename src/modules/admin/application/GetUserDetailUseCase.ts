import type { AdminRepository } from "@/modules/admin/domain/AdminRepository";
import type { AdminUserDetail } from "@/modules/admin/domain/Admin";
import type { GetAuditLogsUseCase } from "@/modules/admin/application/GetAuditLogsUseCase";
import type { GetUsageSummaryUseCase } from "@/modules/subscriptions/application/GetUsageSummaryUseCase";
import { NotFoundError } from "@/shared/errors/AppError";

/**
 * 회원 상세 페이지 데이터 조합 -- 새 리포지토리 메서드를 최소화하고 기존
 * 유스케이스(감사 로그의 userId 필터, 관리자용 사용량 조회 escape hatch)를
 * 그대로 재사용한다.
 */
export class GetUserDetailUseCase {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly getAuditLogsUseCase: GetAuditLogsUseCase,
    private readonly getUsageSummaryUseCase: GetUsageSummaryUseCase,
  ) {}

  async execute(input: { targetUserId: string; actingUserId: string }): Promise<AdminUserDetail> {
    const profile = await this.adminRepository.getUserById(input.targetUserId);
    if (!profile) {
      throw new NotFoundError("사용자를 찾을 수 없습니다.", "ADMIN_USER_NOT_FOUND");
    }

    const [recentActivity, usage] = await Promise.all([
      this.getAuditLogsUseCase.execute({ userId: input.targetUserId, limit: 50 }),
      this.getUsageSummaryUseCase.execute({
        requesterId: input.actingUserId,
        requesterRole: "admin",
        targetUserId: input.targetUserId,
      }),
    ]);

    return {
      profile,
      recentActivity,
      usage: { planCode: usage.planCode, generation: usage.generation },
    };
  }
}
