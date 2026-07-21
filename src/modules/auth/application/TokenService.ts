import type { RefreshTokenRepository } from "@/modules/auth/domain/RefreshTokenRepository";
import { signAccessToken, type AdminTier, type UserRole } from "@/shared/auth/jwt";
import { generateOpaqueToken, hashToken } from "@/shared/auth/opaqueToken";
import { REFRESH_TOKEN_TTL_SECONDS } from "@/shared/auth/constants";
import { AuthenticationError } from "@/shared/errors/AppError";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface RotateResult {
  userId: string;
  newRawRefreshToken: string;
}

function refreshTokenExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);
}

/**
 * Owns the full Refresh Token lifecycle (issue / rotate / revoke). Access
 * Token generation piggy-backs on this service so every code path that
 * hands out a session goes through one place. See Task-004.
 */
export class TokenService {
  constructor(private readonly refreshTokenRepository: RefreshTokenRepository) {}

  async issueTokenPair(user: { id: string; role: UserRole; adminTier?: AdminTier | null }): Promise<TokenPair> {
    const rawRefreshToken = generateOpaqueToken();
    await this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: hashToken(rawRefreshToken),
      expiresAt: refreshTokenExpiry(),
    });

    return {
      accessToken: signAccessToken({ sub: user.id, role: user.role, adminTier: user.adminTier ?? undefined }),
      refreshToken: rawRefreshToken,
    };
  }

  /** Rotation: consumes `rawRefreshToken` and returns a brand new one. */
  async rotate(rawRefreshToken: string): Promise<RotateResult> {
    const tokenHash = hashToken(rawRefreshToken);
    const record = await this.refreshTokenRepository.findByHash(tokenHash);

    if (!record) {
      throw new AuthenticationError("유효하지 않은 refresh token입니다.", "AUTH-007");
    }
    if (record.revokedAt) {
      // A revoked token being presented again means it was already rotated
      // (or logged out) once before — treat as token theft and kill the
      // whole session family.
      await this.refreshTokenRepository.revokeAllForUser(record.userId);
      throw new AuthenticationError(
        "Refresh token이 재사용되어 세션이 무효화되었습니다. 다시 로그인해주세요.",
        "AUTH-008",
      );
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new AuthenticationError("Refresh token이 만료되었습니다.", "AUTH-007");
    }

    const newRawToken = generateOpaqueToken();
    const newRecord = await this.refreshTokenRepository.rotate({
      oldTokenId: record.id,
      newToken: {
        userId: record.userId,
        tokenHash: hashToken(newRawToken),
        expiresAt: refreshTokenExpiry(),
      },
    });

    if (!newRecord) {
      throw new AuthenticationError(
        "동시 요청으로 세션 갱신에 실패했습니다. 다시 시도해주세요.",
        "AUTH-009",
      );
    }

    return { userId: record.userId, newRawRefreshToken: newRawToken };
  }

  /** Best-effort, idempotent: used by logout. Unknown tokens are a no-op. */
  async revoke(rawRefreshToken: string): Promise<void> {
    const record = await this.refreshTokenRepository.findByHash(hashToken(rawRefreshToken));
    if (record) {
      await this.refreshTokenRepository.revokeById(record.id);
    }
  }
}
