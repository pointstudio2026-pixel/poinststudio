import { describe, expect, it } from "vitest";
import { EnsureEmailVerifiedUseCase } from "@/modules/auth/application/EnsureEmailVerifiedUseCase";
import { FakeUserRepository } from "@/modules/auth/testing/fakes";
import { AuthenticationError, AuthorizationError } from "@/shared/errors/AppError";

describe("EnsureEmailVerifiedUseCase", () => {
  it("passes silently for a verified user", async () => {
    const userRepository = new FakeUserRepository();
    const user = await userRepository.create({
      email: "a@aster.dev",
      passwordHash: "hashed:x",
      emailVerifiedAt: new Date(),
    });
    const useCase = new EnsureEmailVerifiedUseCase(userRepository);

    await expect(useCase.execute({ userId: user.id })).resolves.toBeUndefined();
  });

  it("rejects an unverified user with EMAIL_NOT_VERIFIED", async () => {
    const userRepository = new FakeUserRepository();
    const user = await userRepository.create({ email: "a@aster.dev", passwordHash: "hashed:x" });
    const useCase = new EnsureEmailVerifiedUseCase(userRepository);

    await expect(useCase.execute({ userId: user.id })).rejects.toBeInstanceOf(AuthorizationError);
    await expect(useCase.execute({ userId: user.id })).rejects.toMatchObject({ code: "EMAIL_NOT_VERIFIED" });
  });

  it("rejects an unknown user", async () => {
    const userRepository = new FakeUserRepository();
    const useCase = new EnsureEmailVerifiedUseCase(userRepository);

    await expect(useCase.execute({ userId: "missing" })).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("passes an unverified admin account without checking the DB (관리자 우회)", async () => {
    const userRepository = new FakeUserRepository();
    const user = await userRepository.create({ email: "admin@aster.dev", passwordHash: "hashed:x" });
    const useCase = new EnsureEmailVerifiedUseCase(userRepository);

    await expect(
      useCase.execute({ userId: user.id, userRole: "admin" }),
    ).resolves.toBeUndefined();
  });
});
