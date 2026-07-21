import type { Inquiry } from "@/modules/inquiries/domain/Inquiry";

export interface CreateInquiryInput {
  userId: string;
  subject: string;
  message: string;
  isPublic: boolean;
}

export interface InquiryRepository {
  create(input: CreateInquiryInput): Promise<Inquiry>;
  getById(id: string): Promise<Inquiry | null>;
  /** 커뮤니티 목록용 -- 공개/비공개 가리지 않고 전체를 최신순으로 반환한다(제목 마스킹은 유스케이스에서 처리). */
  listAll(): Promise<Inquiry[]>;
}
