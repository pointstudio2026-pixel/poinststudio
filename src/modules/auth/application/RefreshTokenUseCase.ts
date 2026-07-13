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

    await recordActivity({ userId: user.id, eventType: "TOKEN_REFRESHED" });

    return {
      user: toPublicUser(user),
      accessToken: signAccessToken({ sub: user.id, role: user.role }),
      refreshToken: newRawRefreshToken,
    };
  }
}
