import type { UserRepository } from "@/modules/auth/domain/UserRepository";
import { ValidationError } from "@/shared/errors/AppError";

export class VerifyEmailUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: { token: string }): Promise<void> {
    // findByEmailVerificationToken은 만료된 토큰이면 null을 반환한다(구현체
    // 책임) -- 만료/미존재를 구분해 알려줄 필요가 없어 에러 메시지도 동일하다.
    const user = await this.userRepository.findByEmailVerificationToken(input.token);
    if (!user) {
      throw new ValidationError(
        "유효하지 않거나 만료된 인증 링크입니다.",
        undefined,
        "INVALID_VERIFICATION_TOKEN",
      );
    }

    await this.userRepository.markEmailVerified(user.id);
  }
}
