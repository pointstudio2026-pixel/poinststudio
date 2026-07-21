import { describe, expect, it, vi } from "vitest";
import { ChangePasswordUseCase } from "@/modules/auth/application/ChangePasswordUseCase";
import { FakePasswordHasher, FakeUserRepository } from "@/modules/auth/testing/fakes";
import { AuthenticationError, ConflictError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

async function buildUseCaseWithUser() {
  const userRepository = new FakeUserRepository();
  const hasher = new FakePasswordHasher();
  const user = await userRepository.create({
    email: "designer@aster.dev",
    passwordHash: await hasher.hash("oldPassword123"),
  });
  return { useCase: new ChangePasswordUseCase(userRepository, hasher), userRepository, hasher, user };
}

describe("ChangePasswordUseCase", () => {
  it("changes the password when the current password is correct", async () => {
    const { useCase, userRepository, hasher, user } = await buildUseCaseWithUser();

    await useCase.execute({
      userId: user.id,
      currentPassword: "oldPassword123",
      newPassword: "newPassword456",
    });

    const updated = await userRepository.findById(user.id);
    expect(await hasher.verify("newPassword456", updated!.passwordHash!)).toBe(true);
  });

  it("rejects a wrong current password with AUTH-002", async () => {
    const { useCase, user } = await buildUseCaseWithUser();

    await expect(
      useCase.execute({ userId: user.id, currentPassword: "wrong", newPassword: "newPassword456" }),
    ).rejects.toBeInstanceOf(AuthenticationError);
    await expect(
      useCase.execute({ userId: user.id, currentPassword: "wrong", newPassword: "newPassword456" }),
    ).rejects.toMatchObject({ code: "AUTH-002" });
  });

  it("rejects OAuth-only accounts (no passwordHash) with AUTH-007", async () => {
    const userRepository = new FakeUserRepository();
    const hasher = new FakePasswordHasher();
    const user = await userRepository.create({ email: "oauth@aster.dev" });
    const useCase = new ChangePasswordUseCase(userRepository, hasher);

    await expect(
      useCase.execute({ userId: user.id, currentPassword: "anything", newPassword: "newPassword456" }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(
      useCase.execute({ userId: user.id, currentPassword: "anything", newPassword: "newPassword456" }),
    ).rejects.toMatchObject({ code: "AUTH-007" });
  });
});
