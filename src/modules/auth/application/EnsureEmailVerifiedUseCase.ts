import type { UserRepository } from "@/modules/auth/domain/UserRepository";
import type { UserRole } from "@/shared/auth/jwt";
import { AuthenticationError, AuthorizationError } from "@/shared/errors/AppError";

/**
 * 비용이 실제로 발생하는 액션(이미지 생성) 앞단에서만 부르는 게이트 --
 * CheckPlanUseCase와 동일하게 "미리 만들어진 유스케이스를 주입받아 재사용"
 * 하는 형태. 로그인 자체는 막지 않는다(무료 플랜 어뷰징 방어가 목적이라
 * 실제 비용이 드는 지점만 막으면 충분). 관리자 계정은 어뷰징 방어 대상이
 * 아니므로 이메일 인증 없이도 통과시킨다(CheckPlanUseCase의 관리자 무제한
 * 처리와 동일한 패턴).
 */
export class EnsureEmailVerifiedUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: { userId: string; userRole?: UserRole }): Promise<void> {
    if (input.userRole === "admin") {
      return;
    }
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new AuthenticationError("사용자를 찾을 수 없습니다.", "AUTH-006");
    }
    if (!user.emailVerifiedAt) {
      throw new AuthorizationError("이메일 인증 후 이용할 수 있습니다.", "EMAIL_NOT_VERIFIED");
    }
  }
}
