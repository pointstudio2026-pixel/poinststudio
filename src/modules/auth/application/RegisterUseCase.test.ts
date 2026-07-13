import { describe, expect, it, vi } from "vitest";
import { RegisterUseCase } from "@/modules/auth/application/RegisterUseCase";
import type {
  AuthUser,
  CreateUserInput,
  UserRepository,
} from "@/modules/auth/domain/UserRepository";
import type { PasswordHasher } from "@/modules/auth/domain/PasswordHasher";
import { ConflictError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

function buildUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "user-1",
    email: "designer@aster.dev",
    passwordHash: "hashed:password123",
    name: "Designer",
    role: "designer",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

class FakeUserRepository implements UserRepository {
  users = new Map<string, AuthUser>();

  async findByEmail(email: string) {
    return [...this.users.values()].find((u) => u.email === email) ?? null;
  }

  async findById(id: string) {
    return this.users.get(id) ?? null;
  }

  async create(input: CreateUserInput) {
    const user = buildUser({
      id: `user-${this.users.size + 1}`,
      email: input.email,
      passwordHash: input.passwordHash,
      name: input.name ?? null,
    });
    this.users.set(user.id, user);
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

describe("RegisterUseCase", () => {
  it("creates a new user and returns tokens", async () => {
    const repo = new FakeUserRepository();
    const useCase = new RegisterUseCase(repo, new FakePasswordHasher());

    process.env.JWT_ACCESS_SECRET ??= "test-access-secret";
    process.env.JWT_REFRESH_SECRET ??= "test-refresh-secret";

    const result = await useCase.execute({
      email: "new@aster.dev",
      password: "password123",
    });

    expect(result.user.email).toBe("new@aster.dev");
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(repo.users.size).toBe(1);
  });

  it("rejects duplicate emails", async () => {
    const repo = new FakeUserRepository();
    await repo.create({ email: "dup@aster.dev", passwordHash: "hashed:x" });
    const useCase = new RegisterUseCase(repo, new FakePasswordHasher());

    await expect(
      useCase.execute({ email: "dup@aster.dev", password: "password123" }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
