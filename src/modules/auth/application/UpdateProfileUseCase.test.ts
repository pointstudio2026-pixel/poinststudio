import { describe, expect, it, vi } from "vitest";
import { UpdateProfileUseCase } from "@/modules/auth/application/UpdateProfileUseCase";
import { FakeUserRepository } from "@/modules/auth/testing/fakes";
import { AuthenticationError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

async function buildUseCaseWithUser() {
  const userRepository = new FakeUserRepository();
  const user = await userRepository.create({ email: "designer@aster.dev", name: "기존이름" });
  return { useCase: new UpdateProfileUseCase(userRepository), user };
}

describe("UpdateProfileUseCase", () => {
  it("updates the user's name", async () => {
    const { useCase, user } = await buildUseCaseWithUser();

    const result = await useCase.execute({ userId: user.id, name: "새이름" });

    expect(result.name).toBe("새이름");
  });

  it("trims whitespace around the name", async () => {
    const { useCase, user } = await buildUseCaseWithUser();

    const result = await useCase.execute({ userId: user.id, name: "  공백이름  " });

    expect(result.name).toBe("공백이름");
  });

  it("rejects an unknown user with AUTH-006", async () => {
    const useCase = new UpdateProfileUseCase(new FakeUserRepository());

    await expect(useCase.execute({ userId: "missing", name: "이름" })).rejects.toMatchObject({
      code: "AUTH-006",
    });
    await expect(useCase.execute({ userId: "missing", name: "이름" })).rejects.toBeInstanceOf(
      AuthenticationError,
    );
  });
});
