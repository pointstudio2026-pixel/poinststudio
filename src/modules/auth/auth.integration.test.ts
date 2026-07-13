import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/shared/database/prisma";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/PrismaUserRepository";
import { Argon2PasswordHasher } from "@/modules/auth/infrastructure/Argon2PasswordHasher";
import { RegisterUseCase } from "@/modules/auth/application/RegisterUseCase";
import { LoginUseCase } from "@/modules/auth/application/LoginUseCase";
import { AuthenticationError, ConflictError } from "@/shared/errors/AppError";

const TEST_EMAIL_PREFIX = "task002-integration";

function uniqueEmail() {
  return `${TEST_EMAIL_PREFIX}-${Date.now()}-${Math.random().toString(16).slice(2)}@aster.dev`;
}

afterEach(async () => {
  await prisma.user.deleteMany({ where: { email: { startsWith: TEST_EMAIL_PREFIX } } });
});

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
    const repo = new PrismaUserRepository();
    const hasher = new Argon2PasswordHasher();
    const registerUseCase = new RegisterUseCase(repo, hasher);
    const loginUseCase = new LoginUseCase(repo, hasher);
    const email = uniqueEmail();

    const registered = await registerUseCase.execute({ email, password: "password123" });
    expect(registered.user.email).toBe(email);

    const loggedIn = await loginUseCase.execute({ email, password: "password123" });
    expect(loggedIn.user.id).toBe(registered.user.id);

    await expect(
      loginUseCase.execute({ email, password: "wrong-password" }),
    ).rejects.toBeInstanceOf(AuthenticationError);

    await expect(
      registerUseCase.execute({ email, password: "password123" }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
