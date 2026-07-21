import { beforeEach, describe, expect, it, vi } from "vitest";
import { CompleteOAuthSignupUseCase } from "@/modules/auth/application/CompleteOAuthSignupUseCase";
import { TokenService } from "@/modules/auth/application/TokenService";
import {
  FakeOAuthAccountRepository,
  FakeRefreshTokenRepository,
  FakeUserRepository,
} from "@/modules/auth/testing/fakes";

const recordActivity = vi.fn().mockResolvedValue(undefined);
vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: (...args: unknown[]) => recordActivity(...args),
}));

beforeEach(() => {
  process.env.JWT_ACCESS_SECRET ??= "test-access-secret";
  recordActivity.mockClear();
});

function buildUseCase() {
  const userRepository = new FakeUserRepository();
  const oauthAccountRepository = new FakeOAuthAccountRepository();
  const tokenService = new TokenService(new FakeRefreshTokenRepository());
  const useCase = new CompleteOAuthSignupUseCase(userRepository, oauthAccountRepository, tokenService);
  return { userRepository, oauthAccountRepository, useCase };
}

describe("CompleteOAuthSignupUseCase", () => {
  it("creates the account and links the OAuth provider only after explicit consent", async () => {
    const { useCase, userRepository, oauthAccountRepository } = buildUseCase();

    const result = await useCase.execute({
      provider: "google",
      profile: { providerAccountId: "g-1", email: "new@gmail.com", name: "New User", emailVerified: true },
    });

    expect(result.isNewUser).toBe(true);
    expect(result.user.email).toBe("new@gmail.com");
    expect(result.accessToken).toBeTruthy();
    expect(userRepository.users).toHaveLength(1);
    expect(userRepository.users[0]?.emailVerifiedAt).toBeTruthy();
    expect(oauthAccountRepository.accounts).toHaveLength(1);
  });

  it("records the consent timestamp in the same USER_REGISTERED shape as password registration", async () => {
    const { useCase } = buildUseCase();

    await useCase.execute({
      provider: "kakao",
      profile: { providerAccountId: "k-1", email: "consent@aster.dev", name: null, emailVerified: false },
    });

    expect(recordActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "USER_REGISTERED",
        payload: expect.objectContaining({ via: "kakao", agreedToTermsAt: expect.any(String) }),
      }),
    );
  });

  it("does not mark the email verified when the provider itself hadn't verified it", async () => {
    const { useCase, userRepository } = buildUseCase();

    await useCase.execute({
      provider: "kakao",
      profile: { providerAccountId: "k-2", email: "unverified@aster.dev", name: null, emailVerified: false },
    });

    expect(userRepository.users[0]?.emailVerifiedAt).toBeNull();
  });
});
