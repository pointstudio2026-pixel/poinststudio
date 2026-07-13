import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterUseCase } from "@/modules/auth/application/RegisterUseCase";
import { TokenService } from "@/modules/auth/application/TokenService";
import {
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
  return new RegisterUseCase(userRepository, new FakePasswordHasher(), tokenService);
}

describe("RegisterUseCase", () => {
  it("creates a new user and returns tokens", async () => {
    const useCase = buildUseCase();

    const result = await useCase.execute({
      email: "new@aster.dev",
      password: "password123",
    });

    expect(result.user.email).toBe("new@aster.dev");
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
  });

  it("rejects duplicate emails", async () => {
    const userRepository = new FakeUserRepository();
    await userRepository.create({ email: "dup@aster.dev", passwordHash: "hashed:x" });
    const tokenService = new TokenService(new FakeRefreshTokenRepository());
    const useCase = new RegisterUseCase(userRepository, new FakePasswordHasher(), tokenService);

    await expect(
      useCase.execute({ email: "dup@aster.dev", password: "password123" }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
