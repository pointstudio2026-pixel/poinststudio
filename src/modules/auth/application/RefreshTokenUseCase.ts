import type { UserRepository } from "@/modules/auth/domain/UserRepository";
import type { TokenService } from "@/modules/auth/application/TokenService";
import { toPublicUser, type PublicUser } from "@/modules/auth/application/publicUser";
import { signAccessToken } from "@/shared/auth/jwt";
import { recordActivity } from "@/shared/activity/activityLogger";
import { AuthenticationError } from "@/shared/errors/AppError";

export interface RefreshTokenOutput {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenUseCase {
  constructor(
    private readonly tokenService: TokenService,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: { refreshToken: string }): Promise<RefreshTokenOutput> {
    const { userId, newRawRefreshToken } = await this.tokenService.rotate(input.refreshToken);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AuthenticationError("사용자를 찾을 수 없습니다.", "AUTH-006");
    }
    // 세션 도중 정지/삭제되면 다음 refresh(액세스 토큰 TTL마다 발생)에서
    // 바로 로그아웃되게 한다 -- 그렇지 않으면 이미 발급된 액세스 토큰이
    // 만료될 때까지 정지가 실질적으로 반영되지 않는다.
    if (user.deletedAt) {
      throw new AuthenticationError("삭제된 계정입니다.", "AUTH-010");
    }
    if (user.suspendedAt) {
      throw new AuthenticationError("정지된 계정입니다. 문의를 통해 확인해주세요.", "AUTH-011");
    }

    await recordActivity({ userId: user.id, eventType: "TOKEN_REFRESHED" });

    return {
      user: toPublicUser(user),
      accessToken: signAccessToken({ sub: user.id, role: user.role, adminTier: user.adminTier ?? undefined }),
      refreshToken: newRawRefreshToken,
    };
  }
}
