import { describe, expect, it } from "vitest";
import { VerifyEmailUseCase } from "@/modules/auth/application/VerifyEmailUseCase";
import { FakeUserRepository } from "@/modules/auth/testing/fakes";
import { ValidationError } from "@/shared/errors/AppError";

describe("VerifyEmailUseCase", () => {
  it("marks the user verified for a valid, unexpired token", async () => {
    const userRepository = new FakeUserRepository();
    const user = await userRepository.create({ email: "a@aster.dev", passwordHash: "hashed:x" });
    const future = new Date(Date.now() + 60_000);
    await userRepository.setEmailVerificationToken(user.id, "tok-1", future);
    const useCase = new VerifyEmailUseCase(userRepository);

    await useCase.execute({ token: "tok-1" });

    const updated = await userRepository.findById(user.id);
    expect(updated?.emailVerifiedAt).not.toBeNull();
  });

  it("rejects an unknown token", async () => {
    const userRepository = new FakeUserRepository();
    const useCase = new VerifyEmailUseCase(userRepository);

    await expect(useCase.execute({ token: "does-not-exist" })).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects an expired token", async () => {
    const userRepository = new FakeUserRepository();
    const user = await userRepository.create({ email: "a@aster.dev", passwordHash: "hashed:x" });
    const past = new Date(Date.now() - 60_000);
    await userRepository.setEmailVerificationToken(user.id, "tok-expired", past);
    const useCase = new VerifyEmailUseCase(userRepository);

    await expect(useCase.execute({ token: "tok-expired" })).rejects.toBeInstanceOf(ValidationError);
  });
});
