import { describe, expect, it, vi } from "vitest";
import { SubmitInquiryUseCase } from "@/modules/inquiries/application/SubmitInquiryUseCase";
import { GetInquiryUseCase } from "@/modules/inquiries/application/GetInquiryUseCase";
import { FakeInquiryRepository } from "@/modules/inquiries/testing/fakes";
import { AuthorizationError, NotFoundError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

describe("GetInquiryUseCase", () => {
  it("returns a 404 for an unknown inquiry", async () => {
    const repository = new FakeInquiryRepository();
    const getUseCase = new GetInquiryUseCase(repository);

    await expect(
      getUseCase.execute({ inquiryId: "does-not-exist", userId: "user-1" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("lets anyone view a public inquiry's full content", async () => {
    const repository = new FakeInquiryRepository();
    const submit = new SubmitInquiryUseCase(repository);
    const getUseCase = new GetInquiryUseCase(repository);
    const created = await submit.execute({
      userId: "author",
      subject: "공개 질문",
      message: "자세한 내용",
      isPublic: true,
    });

    const result = await getUseCase.execute({ inquiryId: created.id, userId: "someone-else" });

    expect(result.message).toBe("자세한 내용");
  });

  it("lets the author view their own private inquiry", async () => {
    const repository = new FakeInquiryRepository();
    const submit = new SubmitInquiryUseCase(repository);
    const getUseCase = new GetInquiryUseCase(repository);
    const created = await submit.execute({
      userId: "author",
      subject: "비공개 질문",
      message: "민감한 내용",
      isPublic: false,
    });

    const result = await getUseCase.execute({ inquiryId: created.id, userId: "author" });

    expect(result.message).toBe("민감한 내용");
  });

  it("lets an admin view someone else's private inquiry", async () => {
    const repository = new FakeInquiryRepository();
    const submit = new SubmitInquiryUseCase(repository);
    const getUseCase = new GetInquiryUseCase(repository);
    const created = await submit.execute({
      userId: "author",
      subject: "비공개 질문",
      message: "민감한 내용",
      isPublic: false,
    });

    const result = await getUseCase.execute({ inquiryId: created.id, userId: "admin-1", userRole: "admin" });

    expect(result.message).toBe("민감한 내용");
  });

  it("blocks a stranger from viewing a private inquiry (비공개는 본인/관리자 전용)", async () => {
    const repository = new FakeInquiryRepository();
    const submit = new SubmitInquiryUseCase(repository);
    const getUseCase = new GetInquiryUseCase(repository);
    const created = await submit.execute({
      userId: "author",
      subject: "비공개 질문",
      message: "민감한 내용",
      isPublic: false,
    });

    await expect(
      getUseCase.execute({ inquiryId: created.id, userId: "someone-else" }),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });
});
