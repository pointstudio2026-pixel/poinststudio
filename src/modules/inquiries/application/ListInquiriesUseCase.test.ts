import { describe, expect, it, vi } from "vitest";
import { SubmitInquiryUseCase } from "@/modules/inquiries/application/SubmitInquiryUseCase";
import { ListInquiriesUseCase } from "@/modules/inquiries/application/ListInquiriesUseCase";
import { FakeInquiryRepository } from "@/modules/inquiries/testing/fakes";
import { PRIVATE_INQUIRY_PLACEHOLDER } from "@/modules/inquiries/domain/Inquiry";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

describe("ListInquiriesUseCase", () => {
  it("shows the real subject for public inquiries", async () => {
    const repository = new FakeInquiryRepository();
    const submit = new SubmitInquiryUseCase(repository);
    const list = new ListInquiriesUseCase(repository);
    await submit.execute({ userId: "user-1", subject: "공개 질문", message: "내용", isPublic: true });

    const [item] = await list.execute();

    expect(item?.subject).toBe("공개 질문");
    expect(item?.isPublic).toBe(true);
  });

  it("masks the subject for private inquiries regardless of who's asking (목록은 항상 마스킹)", async () => {
    const repository = new FakeInquiryRepository();
    const submit = new SubmitInquiryUseCase(repository);
    const list = new ListInquiriesUseCase(repository);
    await submit.execute({ userId: "author", subject: "비밀 질문", message: "내용", isPublic: false });

    const [item] = await list.execute();

    expect(item?.subject).toBe(PRIVATE_INQUIRY_PLACEHOLDER);
    expect(item?.isPublic).toBe(false);
  });

  it("does not leak the message body in the list shape", async () => {
    const repository = new FakeInquiryRepository();
    const submit = new SubmitInquiryUseCase(repository);
    const list = new ListInquiriesUseCase(repository);
    await submit.execute({ userId: "user-1", subject: "제목", message: "민감한 내용", isPublic: true });

    const [item] = await list.execute();

    expect(item).not.toHaveProperty("message");
  });
});
