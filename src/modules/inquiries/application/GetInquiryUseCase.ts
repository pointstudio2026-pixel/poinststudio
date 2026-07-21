import type { InquiryRepository } from "@/modules/inquiries/domain/InquiryRepository";
import type { Inquiry } from "@/modules/inquiries/domain/Inquiry";
import type { UserRole } from "@/shared/auth/jwt";
import { NotFoundError, AuthorizationError } from "@/shared/errors/AppError";

/** 비공개 글은 작성자 본인 또는 관리자만 상세 열람 가능하다. */
export class GetInquiryUseCase {
  constructor(private readonly inquiryRepository: InquiryRepository) {}

  async execute(input: { inquiryId: string; userId: string; userRole?: UserRole }): Promise<Inquiry> {
    const inquiry = await this.inquiryRepository.getById(input.inquiryId);
    if (!inquiry) {
      throw new NotFoundError("문의를 찾을 수 없습니다.", "INQUIRY_NOT_FOUND");
    }

    if (inquiry.isPublic) {
      return inquiry;
    }

    const isOwner = inquiry.userId === input.userId;
    const isAdmin = input.userRole === "admin";
    if (!isOwner && !isAdmin) {
      throw new AuthorizationError("비공개 문의사항입니다. 작성자 본인 또는 관리자만 볼 수 있습니다.", "INQUIRY-001");
    }

    return inquiry;
  }
}
