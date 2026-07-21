import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/shared/database/prisma";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/PrismaUserRepository";
import { PrismaRefreshTokenRepository } from "@/modules/auth/infrastructure/PrismaRefreshTokenRepository";
import { Argon2PasswordHasher } from "@/modules/auth/infrastructure/Argon2PasswordHasher";
import { TokenService } from "@/modules/auth/application/TokenService";
import { RegisterUseCase } from "@/modules/auth/application/RegisterUseCase";
import { LoginUseCase } from "@/modules/auth/application/LoginUseCase";
import { FakeEmailProvider } from "@/modules/auth/testing/fakes";
import { AuthenticationError, ConflictError } from "@/shared/errors/AppError";

const TEST_EMAIL_PREFIX = "task002-integration";

function uniqueEmail() {
  return `${TEST_EMAIL_PREFIX}-${Date.now()}-${Math.random().toString(16).slice(2)}@aster.dev`;
}

afterEach(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: TEST_EMAIL_PREFIX } } });
});

function buildContainer() {
  const userRepository = new PrismaUserRepository();
  const refreshTokenRepository = new PrismaRefreshTokenRepository();
  const tokenService = new TokenService(refreshTokenRepository);
  const hasher = new Argon2PasswordHasher();
  return {
    userRepository,
    tokenService,
    registerUseCase: new RegisterUseCase(userRepository, hasher, tokenService, new FakeEmailProvider()),
    loginUseCase: new LoginUseCase(userRepository, hasher, tokenService),
  };
}

describe("Auth module (real Postgres)", () => {
  it("PrismaUserRepository persists and retrieves a user", async () => {
    const repo = new PrismaUserRepository();
    const email = uniqueEmail();

    const created = await repo.create({ email, passwordHash: "hashed:x", name: "Tester" });
    expect(created.id).toBeTruthy();

    const byEmail = await repo.findByEmail(email);
    expect(byEmail?.id).toBe(created.id);

    const byId = await repo.findById(created.id);
    expect(byId?.email).toBe(email);
  });

  it("registers then logs in a real user end-to-end", async () => {
    const { registerUseCase, loginUseCase } = buildContainer();
    const email = uniqueEmail();

    const registered = await registerUseCase.execute({ email, password: "password123", agreedToTerms: true });
    expect(registered.user.email).toBe(email);

    const loggedIn = await loginUseCase.execute({ email, password: "password123" });
    expect(loggedIn.user.id).toBe(registered.user.id);

    await expect(
      loginUseCase.execute({ email, password: "wrong-password" }),
    ).rejects.toBeInstanceOf(AuthenticationError);

    await expect(
      registerUseCase.execute({ email, password: "password123", agreedToTerms: true }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("rotates a real refresh token and rejects reuse of the old one", async () => {
    const { registerUseCase, tokenService } = buildContainer();
    const email = uniqueEmail();

    const registered = await registerUseCase.execute({ email, password: "password123", agreedToTerms: true });
    const rotated = await tokenService.rotate(registered.refreshToken);
    expect(rotated.userId).toBe(registered.user.id);

    await expect(
      tokenService.rotate(registered.refreshToken),
    ).rejects.toMatchObject({ code: "AUTH-008" });
  });

  it("only lets one of two truly concurrent rotations win against real Postgres", async () => {
    const { registerUseCase, tokenService } = buildContainer();
    const email = uniqueEmail();
    const registered = await registerUseCase.execute({ email, password: "password123", agreedToTerms: true });

    const results = await Promise.allSettled([
      tokenService.rotate(registered.refreshToken),
      tokenService.rotate(registered.refreshToken),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
  });
});
