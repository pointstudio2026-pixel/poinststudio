import type { UserRepository } from "@/modules/auth/domain/UserRepository";
import type { PasswordHasher } from "@/modules/auth/domain/PasswordHasher";
import type { ChangePasswordInput } from "@/modules/auth/schemas/auth.schemas";
import { recordActivity } from "@/shared/activity/activityLogger";
import { AuthenticationError, ConflictError } from "@/shared/errors/AppError";

export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: { userId: string } & ChangePasswordInput): Promise<void> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new AuthenticationError("사용자를 찾을 수 없습니다.", "AUTH-006");
    }
    if (!user.passwordHash) {
      throw new ConflictError(
        "소셜 로그인 계정에는 비밀번호가 설정되어 있지 않습니다.",
        "AUTH-007",
      );
    }

    const isValid = await this.passwordHasher.verify(input.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new AuthenticationError("현재 비밀번호가 올바르지 않습니다.", "AUTH-002");
    }

    const newPasswordHash = await this.passwordHasher.hash(input.newPassword);
    await this.userRepository.updatePassword(input.userId, newPasswordHash);

    await recordActivity({ userId: input.userId, eventType: "USER_PASSWORD_CHANGED" });
  }
}
