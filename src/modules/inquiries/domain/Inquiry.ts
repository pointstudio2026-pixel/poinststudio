export interface Inquiry {
  id: string;
  userId: string;
  subject: string;
  message: string;
  isPublic: boolean;
  locale: string;
  createdAt: Date;
}

// 커뮤니티형 목록에서 쓰는 요약 항목 -- 비공개 글은 제목 대신 이 문구가
// 나가야 하므로, 목록 유스케이스가 실제 subject 대신 이 타입을 돌려준다
// (누구든 볼 수 있는지 여부와 무관하게 목록에서는 항상 이 규칙을 적용한다).
export const PRIVATE_INQUIRY_PLACEHOLDER = "비공개 문의사항입니다";

export interface InquiryListItem {
  id: string;
  subject: string;
  isPublic: boolean;
  createdAt: Date;
}
