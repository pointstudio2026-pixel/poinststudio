import type { UserRepository } from "@/modules/auth/domain/UserRepository";
import type { PasswordHasher } from "@/modules/auth/domain/PasswordHasher";
import type { LoginInput } from "@/modules/auth/schemas/auth.schemas";
import { toPublicUser, type PublicUser } from "@/modules/auth/application/publicUser";
import type { TokenService } from "@/modules/auth/application/TokenService";
import { recordActivity } from "@/shared/activity/activityLogger";
import { AuthenticationError } from "@/shared/errors/AppError";

export interface LoginOutput {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new AuthenticationError("등록되지 않은 이메일입니다.", "AUTH-001");
    }

    const isValid = user.passwordHash
      ? await this.passwordHasher.verify(input.password, user.passwordHash)
      : false;
    if (!isValid) {
      throw new AuthenticationError("비밀번호가 올바르지 않습니다.", "AUTH-002");
    }

    // 비밀번호를 아는 사람에게만 정지/삭제 여부를 알려준다(순서가 반대면
    // 비밀번호 없이도 계정 상태를 알아낼 수 있게 된다).
    if (user.deletedAt) {
      throw new AuthenticationError("삭제된 계정입니다.", "AUTH-010");
    }
    if (user.suspendedAt) {
      throw new AuthenticationError("정지된 계정입니다. 문의를 통해 확인해주세요.", "AUTH-011");
    }

    await recordActivity({ userId: user.id, eventType: "USER_LOGGED_IN" });
    await this.userRepository.updateLastLogin(user.id);

    const tokens = await this.tokenService.issueTokenPair({
      id: user.id,
      role: user.role,
      adminTier: user.adminTier,
    });

    return { user: toPublicUser(user), ...tokens };
  }
}
