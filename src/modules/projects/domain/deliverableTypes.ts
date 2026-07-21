// 어떤 종류의 작업물을 만들고 싶은지 -- 프로젝트 생성 직후 가장 먼저 묻는
// 값이며, 이후 인터뷰 질문 구성/브랜드 전략·로고 스타일 단계 존재 여부/이미지
// 생성 목표 문구를 모두 좌우하는 최상위 분기값이다. `prisma/seedStyles.ts`의
// `DELIVERABLE_TYPES` 이름과 정확히 일치해야 한다(스타일 대분류와 대조할 때 쓰인다).
export const DELIVERABLE_TYPE_OPTIONS = [
  "브랜딩 & 로고",
  "포스터",
  "리플렛",
  "브로슈어",
  "명함",
  "패키지",
  "앱 디자인",
  "웹사이트",
];

// "브랜드 전략"/"로고 스타일" 단계는 이 유형에서만 존재한다.
export const BRANDING_LOGO_DELIVERABLE_TYPE = "브랜딩 & 로고";

export function isBrandingDeliverableType(deliverableType: string | null | undefined): boolean {
  return deliverableType == null || deliverableType === BRANDING_LOGO_DELIVERABLE_TYPE;
}
