import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginUseCase } from "@/modules/auth/application/LoginUseCase";
import { TokenService } from "@/modules/auth/application/TokenService";
import {
  FakePasswordHasher,
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

async function buildUseCaseWithUser() {
  const userRepository = new FakeUserRepository();
  const hasher = new FakePasswordHasher();
  await userRepository.create({
    email: "designer@aster.dev",
    passwordHash: await hasher.hash("password123"),
  });
  const tokenService = new TokenService(new FakeRefreshTokenRepository());
  return { useCase: new LoginUseCase(userRepository, hasher, tokenService), userRepository };
}

describe("LoginUseCase", () => {
  it("logs in with correct credentials", async () => {
    const { useCase } = await buildUseCaseWithUser();

    const result = await useCase.execute({
      email: "designer@aster.dev",
      password: "password123",
    });

    expect(result.user.email).toBe("designer@aster.dev");
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
  });

  it("rejects an unknown email with AUTH-001", async () => {
    const tokenService = new TokenService(new FakeRefreshTokenRepository());
    const useCase = new LoginUseCase(
      new FakeUserRepository(),
      new FakePasswordHasher(),
      tokenService,
    );

    await expect(
      useCase.execute({ email: "missing@aster.dev", password: "password123" }),
    ).rejects.toMatchObject({ code: "AUTH-001" });
  });

  it("rejects a wrong password with AUTH-002", async () => {
    const { useCase } = await buildUseCaseWithUser();

    await expect(
      useCase.execute({ email: "designer@aster.dev", password: "wrong-password" }),
    ).rejects.toBeInstanceOf(AuthenticationError);
    await expect(
      useCase.execute({ email: "designer@aster.dev", password: "wrong-password" }),
    ).rejects.toMatchObject({ code: "AUTH-002" });
  });

  it("rejects a deleted account with AUTH-010 even with correct credentials", async () => {
    const userRepository = new FakeUserRepository();
    const hasher = new FakePasswordHasher();
    await userRepository.create({
      email: "deleted@aster.dev",
      passwordHash: await hasher.hash("password123"),
    });
    userRepository.users[0]!.deletedAt = new Date();
    const tokenService = new TokenService(new FakeRefreshTokenRepository());
    const useCase = new LoginUseCase(userRepository, hasher, tokenService);

    await expect(
      useCase.execute({ email: "deleted@aster.dev", password: "password123" }),
    ).rejects.toMatchObject({ code: "AUTH-010" });
  });

  it("rejects a suspended account with AUTH-011 even with correct credentials", async () => {
    const userRepository = new FakeUserRepository();
    const hasher = new FakePasswordHasher();
    await userRepository.create({
      email: "suspended@aster.dev",
      passwordHash: await hasher.hash("password123"),
    });
    userRepository.users[0]!.suspendedAt = new Date();
    const tokenService = new TokenService(new FakeRefreshTokenRepository());
    const useCase = new LoginUseCase(userRepository, hasher, tokenService);

    await expect(
      useCase.execute({ email: "suspended@aster.dev", password: "password123" }),
    ).rejects.toMatchObject({ code: "AUTH-011" });
  });

  it("updates lastLoginAt on a successful login", async () => {
    const { useCase, userRepository } = await buildUseCaseWithUser();

    expect(userRepository.users[0]!.lastLoginAt).toBeNull();
    await useCase.execute({ email: "designer@aster.dev", password: "password123" });
    expect(userRepository.users[0]!.lastLoginAt).toBeInstanceOf(Date);
  });
});
