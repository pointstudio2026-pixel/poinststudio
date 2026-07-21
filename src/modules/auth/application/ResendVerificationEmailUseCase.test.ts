import { describe, expect, it } from "vitest";
import { ResendVerificationEmailUseCase } from "@/modules/auth/application/ResendVerificationEmailUseCase";
import { FakeEmailProvider, FakeUserRepository } from "@/modules/auth/testing/fakes";
import { AuthenticationError } from "@/shared/errors/AppError";

describe("ResendVerificationEmailUseCase", () => {
  it("issues a new token and sends a new email for an unverified user", async () => {
    const userRepository = new FakeUserRepository();
    const emailProvider = new FakeEmailProvider();
    const user = await userRepository.create({ email: "a@aster.dev", passwordHash: "hashed:x" });
    await userRepository.setEmailVerificationToken(user.id, "old-token", new Date(Date.now() + 60_000));
    const useCase = new ResendVerificationEmailUseCase(userRepository, emailProvider);

    await useCase.execute({ userId: user.id });

    const updated = await userRepository.findById(user.id);
    expect(emailProvider.sent).toHaveLength(1);
    expect(emailProvider.sent[0]!.to).toBe("a@aster.dev");
    expect(updated).toBeTruthy();
  });

  it("is idempotent (no-op) for an already-verified user", async () => {
    const userRepository = new FakeUserRepository();
    const emailProvider = new FakeEmailProvider();
    const user = await userRepository.create({
      email: "a@aster.dev",
      passwordHash: "hashed:x",
      emailVerifiedAt: new Date(),
    });
    const useCase = new ResendVerificationEmailUseCase(userRepository, emailProvider);

    await useCase.execute({ userId: user.id });

    expect(emailProvider.sent).toHaveLength(0);
  });

  it("rejects an unknown user", async () => {
    const userRepository = new FakeUserRepository();
    const emailProvider = new FakeEmailProvider();
    const useCase = new ResendVerificationEmailUseCase(userRepository, emailProvider);

    await expect(useCase.execute({ userId: "missing" })).rejects.toBeInstanceOf(AuthenticationError);
  });
});
