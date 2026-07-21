import { beforeEach, describe, expect, it, vi } from "vitest";
import { OAuthConsentRequiredError, OAuthLoginUseCase } from "@/modules/auth/application/OAuthLoginUseCase";
import { CompleteOAuthSignupUseCase } from "@/modules/auth/application/CompleteOAuthSignupUseCase";
import { TokenService } from "@/modules/auth/application/TokenService";
import {
  FakeOAuthAccountRepository,
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

function buildUseCase() {
  const userRepository = new FakeUserRepository();
  const oauthAccountRepository = new FakeOAuthAccountRepository();
  const tokenService = new TokenService(new FakeRefreshTokenRepository());
  const useCase = new OAuthLoginUseCase(userRepository, oauthAccountRepository, tokenService);
  const signupUseCase = new CompleteOAuthSignupUseCase(userRepository, oauthAccountRepository, tokenService);
  return { userRepository, oauthAccountRepository, tokenService, useCase, signupUseCase };
}

describe("OAuthLoginUseCase", () => {
  it("does NOT auto-create an account for a genuinely new sign-in -- signals consent is required (신규 가입은 동의 절차 필요)", async () => {
    const { useCase, userRepository } = buildUseCase();

    const attempt = useCase.execute({
      provider: "google",
      profile: { providerAccountId: "g-1", email: "new@gmail.com", name: "New User", emailVerified: true },
    });

    await expect(attempt).rejects.toBeInstanceOf(OAuthConsentRequiredError);
    expect(userRepository.users).toHaveLength(0);
  });

  it("logs in as the same user on a repeat sign-in after consent was completed once (재로그인)", async () => {
    const { useCase, signupUseCase, userRepository } = buildUseCase();
    const profile = { providerAccountId: "g-2", email: "repeat@gmail.com", name: "Repeat", emailVerified: true };

    const first = await signupUseCase.execute({ provider: "google", profile });
    const second = await useCase.execute({ provider: "google", profile });

    expect(second.isNewUser).toBe(false);
    expect(second.user.id).toBe(first.user.id);
    expect(userRepository.users).toHaveLength(1);
  });

  it("auto-links to an existing password account when the OAuth email is verified (기존 계정 연결, 동의 불필요)", async () => {
    const { useCase, userRepository, oauthAccountRepository } = buildUseCase();
    const existing = await userRepository.create({ email: "existing@aster.dev", passwordHash: "hashed:x" });

    const result = await useCase.execute({
      provider: "kakao",
      profile: { providerAccountId: "k-1", email: "existing@aster.dev", name: "Existing", emailVerified: true },
    });

    expect(result.isNewUser).toBe(false);
    expect(result.user.id).toBe(existing.id);
    expect(userRepository.users).toHaveLength(1);
    expect(oauthAccountRepository.accounts).toHaveLength(1);
  });

  it("does NOT auto-link when the OAuth email is unverified -- requires consent instead of silently creating a separate user (미검증 이메일 보호)", async () => {
    const { useCase, userRepository } = buildUseCase();
    await userRepository.create({ email: "victim@aster.dev", passwordHash: "hashed:x" });

    const attempt = useCase.execute({
      provider: "kakao",
      profile: { providerAccountId: "k-2", email: "victim@aster.dev", name: "Attacker", emailVerified: false },
    });

    await expect(attempt).rejects.toBeInstanceOf(OAuthConsentRequiredError);
    expect(userRepository.users).toHaveLength(1);
  });

  it("returns tokens usable like a normal session on repeat sign-in", async () => {
    const { useCase, signupUseCase } = buildUseCase();
    const profile = { providerAccountId: "g-3", email: "tok@gmail.com", name: null, emailVerified: true };
    await signupUseCase.execute({ provider: "google", profile });

    const result = await useCase.execute({ provider: "google", profile });

    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
  });

  it("rejects a suspended account on repeat sign-in with AUTH-011", async () => {
    const { useCase, signupUseCase, userRepository } = buildUseCase();
    const profile = { providerAccountId: "g-4", email: "suspended@gmail.com", name: null, emailVerified: true };
    await signupUseCase.execute({ provider: "google", profile });
    userRepository.users[0]!.suspendedAt = new Date();

    const attempt = useCase.execute({ provider: "google", profile });
    await expect(attempt).rejects.toBeInstanceOf(AuthenticationError);
    await expect(attempt).rejects.toMatchObject({ code: "AUTH-011" });
  });

  it("rejects a deleted account on repeat sign-in with AUTH-010", async () => {
    const { useCase, signupUseCase, userRepository } = buildUseCase();
    const profile = { providerAccountId: "g-5", email: "deleted@gmail.com", name: null, emailVerified: true };
    await signupUseCase.execute({ provider: "google", profile });
    userRepository.users[0]!.deletedAt = new Date();

    await expect(useCase.execute({ provider: "google", profile })).rejects.toMatchObject({ code: "AUTH-010" });
  });
});
