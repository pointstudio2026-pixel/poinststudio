import { describe, expect, it, vi } from "vitest";
import { SubmitInquiryUseCase } from "@/modules/inquiries/application/SubmitInquiryUseCase";
import { FakeInquiryRepository } from "@/modules/inquiries/testing/fakes";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

describe("SubmitInquiryUseCase", () => {
  it("creates an inquiry for the user", async () => {
    const repository = new FakeInquiryRepository();
    const useCase = new SubmitInquiryUseCase(repository);

    const inquiry = await useCase.execute({
      userId: "user-1",
      subject: "질문 있어요",
      message: "내용입니다.",
      isPublic: false,
    });

    expect(inquiry.userId).toBe("user-1");
    expect(inquiry.subject).toBe("질문 있어요");
    expect(repository.inquiries).toHaveLength(1);
  });

  it("trims whitespace around subject and message", async () => {
    const repository = new FakeInquiryRepository();
    const useCase = new SubmitInquiryUseCase(repository);

    const inquiry = await useCase.execute({
      userId: "user-1",
      subject: "  제목  ",
      message: "  내용  ",
      isPublic: false,
    });

    expect(inquiry.subject).toBe("제목");
    expect(inquiry.message).toBe("내용");
  });

  it("stores the chosen visibility", async () => {
    const repository = new FakeInquiryRepository();
    const useCase = new SubmitInquiryUseCase(repository);

    const publicInquiry = await useCase.execute({
      userId: "user-1",
      subject: "공개 문의",
      message: "내용",
      isPublic: true,
    });
    expect(publicInquiry.isPublic).toBe(true);

    const privateInquiry = await useCase.execute({
      userId: "user-1",
      subject: "비공개 문의",
      message: "내용",
      isPublic: false,
    });
    expect(privateInquiry.isPublic).toBe(false);
  });
});
