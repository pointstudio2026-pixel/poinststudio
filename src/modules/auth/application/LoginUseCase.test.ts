import { describe, expect, it, vi } from "vitest";
import { LoginUseCase } from "@/modules/auth/application/LoginUseCase";
import type {
  AuthUser,
  CreateUserInput,
  UserRepository,
} from "@/modules/auth/domain/UserRepository";
import type { PasswordHasher } from "@/modules/auth/domain/PasswordHasher";
import { AuthenticationError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

class FakeUserRepository implements UserRepository {
  users: AuthUser[] = [];

  async findByEmail(email: string) {
    return this.users.find((u) => u.email === email) ?? null;
  }

  async findById(id: string) {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async create(input: CreateUserInput) {
    const user: AuthUser = {
      id: `user-${this.users.length + 1}`,
      email: input.email,
      passwordHash: input.passwordHash,
      name: input.name ?? null,
      role: "designer",
      createdAt: new Date(),
    };
    this.users.push(user);
    return user;
  }
}

class FakePasswordHasher implements PasswordHasher {
  async hash(plainPassword: string) {
    return `hashed:${plainPassword}`;
  }

  async verify(plainPassword: string, hash: string) {
    return hash === `hashed:${plainPassword}`;
  }
}

describe("LoginUseCase", () => {
  process.env.JWT_ACCESS_SECRET ??= "test-access-secret";
  process.env.JWT_REFRESH_SECRET ??= "test-refresh-secret";

  it("logs in with correct credentials", async () => {
    const repo = new FakeUserRepository();
    const hasher = new FakePasswordHasher();
    await repo.create({
      email: "designer@aster.dev",
      passwordHash: await hasher.hash("password123"),
    });
    const useCase = new LoginUseCase(repo, hasher);

    const result = await useCase.execute({
      email: "designer@aster.dev",
      password: "password123",
    });

    expect(result.user.email).toBe("designer@aster.dev");
    expect(result.accessToken).toBeTruthy();
  });

  it("rejects an unknown email with AUTH-001", async () => {
    const useCase = new LoginUseCase(new FakeUserRepository(), new FakePasswordHasher());

    await expect(
      useCase.execute({ email: "missing@aster.dev", password: "password123" }),
    ).rejects.toMatchObject({ code: "AUTH-001" });
  });

  it("rejects a wrong password with AUTH-002", async () => {
    const repo = new FakeUserRepository();
    const hasher = new FakePasswordHasher();
    await repo.create({
      email: "designer@aster.dev",
      passwordHash: await hasher.hash("password123"),
    });
    const useCase = new LoginUseCase(repo, hasher);

    await expect(
      useCase.execute({ email: "designer@aster.dev", password: "wrong-password" }),
    ).rejects.toMatchObject({ code: "AUTH-002" });
    await expect(
      useCase.execute({ email: "designer@aster.dev", password: "wrong-password" }),
    ).rejects.toBeInstanceOf(AuthenticationError);
  });
});
