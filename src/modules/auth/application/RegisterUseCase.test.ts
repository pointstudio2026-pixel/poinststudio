import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterUseCase } from "@/modules/auth/application/RegisterUseCase";
import { TokenService } from "@/modules/auth/application/TokenService";
import {
  FakeEmailProvider,
  FakePasswordHasher,
  FakeRefreshTokenRepository,
  FakeUserRepository,
} from "@/modules/auth/testing/fakes";
import { ConflictError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  process.env.JWT_ACCESS_SECRET ??= "test-access-secret";
});

function buildUseCase() {
  const userRepository = new FakeUserRepository();
  const tokenService = new TokenService(new FakeRefreshTokenRepository());
  const emailProvider = new FakeEmailProvider();
  return { useCase: new RegisterUseCase(userRepository, new FakePasswordHasher(), tokenService, emailProvider), userRepository, emailProvider };
}

describe("RegisterUseCase", () => {
  it("creates a new user and returns tokens", async () => {
    const { useCase } = buildUseCase();

    const result = await useCase.execute({
      email: "new@aster.dev",
      password: "password123",
      agreedToTerms: true,
    });

    expect(result.user.email).toBe("new@aster.dev");
    expect(result.user.emailVerified).toBe(false);
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
  });

  it("issues a verification token and sends a verification email", async () => {
    const { useCase, userRepository, emailProvider } = buildUseCase();

    const result = await useCase.execute({ email: "new@aster.dev", password: "password123", agreedToTerms: true });

    const stored = await userRepository.findById(result.user.id);
    expect(stored?.emailVerifiedAt).toBeNull();
    expect(emailProvider.sent).toHaveLength(1);
    expect(emailProvider.sent[0]!.to).toBe("new@aster.dev");
    expect(emailProvider.sent[0]!.html).toContain("/verify-email?token=");
  });

  it("rejects duplicate emails", async () => {
    const userRepository = new FakeUserRepository();
    await userRepository.create({ email: "dup@aster.dev", passwordHash: "hashed:x" });
    const tokenService = new TokenService(new FakeRefreshTokenRepository());
    const useCase = new RegisterUseCase(userRepository, new FakePasswordHasher(), tokenService, new FakeEmailProvider());

    await expect(
      useCase.execute({ email: "dup@aster.dev", password: "password123", agreedToTerms: true }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
