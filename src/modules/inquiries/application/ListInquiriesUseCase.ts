import type { InquiryRepository } from "@/modules/inquiries/domain/InquiryRepository";
import { PRIVATE_INQUIRY_PLACEHOLDER, type InquiryListItem } from "@/modules/inquiries/domain/Inquiry";

/**
 * 커뮤니티 게시판형 목록 -- 공개글은 제목을 그대로, 비공개글은 작성자·
 * 관리자 여부와 무관하게 항상 "비공개 문의사항입니다"로 가려서 보여준다
 * (실제 내용 열람 권한은 GetInquiryUseCase가 상세 조회 시점에 따로 검사).
 */
export class ListInquiriesUseCase {
  constructor(private readonly inquiryRepository: InquiryRepository) {}

  async execute(input?: { locale?: string }): Promise<InquiryListItem[]> {
    const inquiries = await this.inquiryRepository.listAll(input?.locale);
    return inquiries.map((inquiry) => ({
      id: inquiry.id,
      subject: inquiry.isPublic ? inquiry.subject : PRIVATE_INQUIRY_PLACEHOLDER,
      isPublic: inquiry.isPublic,
      createdAt: inquiry.createdAt,
    }));
  }
}
