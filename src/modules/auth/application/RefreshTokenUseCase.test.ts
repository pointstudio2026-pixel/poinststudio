import { beforeEach, describe, expect, it, vi } from "vitest";
import { RefreshTokenUseCase } from "@/modules/auth/application/RefreshTokenUseCase";
import { TokenService } from "@/modules/auth/application/TokenService";
import {
  FakeRefreshTokenRepository,
  FakeUserRepository,
} from "@/modules/auth/testing/fakes";
import { AuthenticationError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  process.env.JWT_ACCESS_SECRET ??= "test-access-secret";
});

describe("RefreshTokenUseCase", () => {
  it("returns a new token pair and the current user for a valid refresh token", async () => {
    const userRepository = new FakeUserRepository();
    const user = await userRepository.create({
      email: "designer@aster.dev",
      passwordHash: "hashed:x",
    });
    const tokenService = new TokenService(new FakeRefreshTokenRepository());
    const { refreshToken } = await tokenService.issueTokenPair({
      id: user.id,
      role: user.role,
    });
    const useCase = new RefreshTokenUseCase(tokenService, userRepository);

    const result = await useCase.execute({ refreshToken });

    expect(result.user.id).toBe(user.id);
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).not.toBe(refreshToken);
  });

  it("rejects when the token is valid but the user no longer exists", async () => {
    const userRepository = new FakeUserRepository();
    const tokenService = new TokenService(new FakeRefreshTokenRepository());
    const { refreshToken } = await tokenService.issueTokenPair({
      id: "ghost-user",
      role: "designer",
    });
    const useCase = new RefreshTokenUseCase(tokenService, userRepository);

    await expect(useCase.execute({ refreshToken })).rejects.toBeInstanceOf(
      AuthenticationError,
    );
  });
});
